import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AttendanceEventType,
  AttendanceTransactionEntity,
  DenialReason,
  QrValidationStatus,
  ScanTransactionStatus,
  SyncStatus,
} from '../entities/attendance-transaction.entity';
import { GateEntity } from '../entities/gate.entity';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { ScanValidationPipeline } from './pipeline/scan-validation-pipeline';
import { ScanContext } from './pipeline/scan-context.interface';
import { ScanRequestDto } from './dto/scan-request.dto';
import {
  AttendanceTransactionResponseDto,
  PaginatedTransactionsResponseDto,
  ScanResponseDto,
} from './dto/scan-response.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { DailySummaryQueryDto } from './dto/daily-summary-query.dto';
import {
  DailyAttendanceStatus,
  DailySummaryItemDto,
  PaginatedDailySummaryResponseDto,
} from './dto/daily-summary-response.dto';
import {
  AttendanceDistributionItemDto,
  AttendanceStatus,
  AttendanceTrendItemDto,
  DashboardResponseDto,
  FactoryBreakdownItemDto,
  FactoryComparisonItemDto,
  GateTrafficDistributionDto,
} from './dto/dashboard-response.dto';
import { FactoryId } from '../employees/enums/factory.enum';
import { pagination } from '../utils/common/handle';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { EmploymentStatus } from '../employees/enums/employment-status.enum';
import * as crypto from 'crypto';
import { FactoryEntity } from 'src/entities/factory.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  // Standard work shift parameters (per section 6 system config)
  private readonly shiftStartMinutes = 7 * 60 + 30; // 07:30
  private readonly lateThresholdMinutes = 15; // > 07:45 is late

  constructor(
    @InjectRepository(AttendanceTransactionEntity)
    private readonly transactionRepository: Repository<AttendanceTransactionEntity>,
    @InjectRepository(GateEntity)
    private readonly gateRepository: Repository<GateEntity>,
    @InjectRepository(QrCodeEntity)
    private readonly qrCodeRepository: Repository<QrCodeEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(FactoryEntity)
    private readonly factoryRepository: Repository<FactoryEntity>,
    private readonly validationPipeline: ScanValidationPipeline,
  ) {}

  /**
   * Core Access Engine: validates QR against gate rules, records transaction
   */
  async scan(dto: ScanRequestDto): Promise<ScanResponseDto> {
    const timestamp = new Date();
    // Lookup Gate
    const gate = await this.gateRepository.findOne({
      where: { id: dto.gateId },
    });

    // Lookup QR Code
    const qrCode = await this.qrCodeRepository.findOne({
      where: { payload: dto.qrPayload },
    });

    // Lookup Employee if QR exists
    let employee: EmployeeEntity | null = null;
    if (qrCode) {
      employee = await this.employeeRepository.findOne({
        where: { id: qrCode.employeeId },
      });
    }

    // Build Scan Context for Chain of Responsibility Pipeline
    const initialContext: ScanContext = {
      qrPayload: dto.qrPayload,
      gateId: dto.gateId,
      eventType: dto.eventType,
      offline: dto.offline ?? false,
      timestamp,
      gate,
      qrCode,
      employee,
      isAllowed: true,
      qrValidation: QrValidationStatus.VALID,
    };

    // Execute Validation Pipeline Sequence
    const validatedContext = await this.validationPipeline.execute(initialContext);

    const isSuccess = validatedContext.isAllowed;
    const factoryId =
      gate?.factoryId ?? employee?.factoryId ?? qrCode?.factoryId ?? null;
    const gateName = gate?.name ?? dto.gateId;
    const employeeId = employee?.id ?? qrCode?.employeeId ?? null;

    // Persist Transaction
    const transaction = this.transactionRepository.create({
      employeeId,
      factoryId: factoryId,
      gateId: dto.gateId,
      eventType: dto.eventType,
      timestamp,
      qrPayload: dto.qrPayload,
      qrValidation: validatedContext.qrValidation,
      status: isSuccess
        ? ScanTransactionStatus.SUCCESS
        : ScanTransactionStatus.DENIED,
      denialReason: validatedContext.denialReason ?? null,
      errorMessage: validatedContext.errorMessage ?? null,
      synced: true,
      syncStatus: SyncStatus.SYNCED,
      offline: dto.offline ?? false,
    });

    await this.transactionRepository.save(transaction);

    // If access granted, update QR code lastUsedAt
    if (isSuccess && qrCode) {
      await this.qrCodeRepository.update(
        { id: qrCode.id },
        { lastUsedAt: timestamp },
      );
    }

    const message = isSuccess
      ? 'Access granted — gate unlocked'
      : validatedContext.errorMessage || 'Access denied';

    return {
      transaction: this.toTransactionDto(transaction),
      message,
    };
  }

  /**
   * Query access transaction logs with full filters and utils pagination
   */
  async listTransactions(
    params: ListTransactionsDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    const offset =
      params.offset && params.offset > 0
        ? Number(params.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      params.limit && params.limit > 0
        ? Number(params.limit)
        : DEFAULT_LIMIT_NUMBER;

    const qb = this.transactionRepository.createQueryBuilder('tx')
      .leftJoin('tx.gate', 'gate')
      .addSelect(['gate.id', 'gate.code', 'gate.name'])
      .leftJoin('tx.employee', 'employee')
      .addSelect(['employee.fullName', 'employee.code'])
      .leftJoin('employee.factory', 'factory')
      .addSelect(['factory.code', 'factory.name'])
      .leftJoin('employee.department', 'department')
      .addSelect(['department.id', 'department.name']);

    if (params.q) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(tx.employeeId) LIKE :q OR LOWER(employee.fullName) LIKE :q OR LOWER(tx.id) LIKE :q OR LOWER(tx.gateName) LIKE :q)',
        { q },
      );
    }

    if (params.employeeId) {
      qb.andWhere('tx.employeeId = :employeeId', {
        employeeId: params.employeeId,
      })
    }

    if (params.gateId) {
      qb.andWhere('tx.gateId = :gateId', { gateId: params.gateId });
    }

    if (params.factoryId && params.factoryId !== 'ALL') {
      qb.andWhere('tx.factoryId = :factoryId', {
        factoryId: params.factoryId,
      });
    }
    if (params.departmentId && params.departmentId !== 'ALL') {
      qb.andWhere('employee.departmentId = :departmentId', {
        departmentId: params.departmentId,
      });
    }

    if (params.eventType && params.eventType !== 'ALL') {
      qb.andWhere('tx.eventType = :eventType', {
        eventType: params.eventType,
      });
    }

    if (params.status && params.status !== 'ALL') {
      qb.andWhere('tx.status = :status', { status: params.status });
    }

    if (params.from && params.to) {
      qb.andWhere('tx.timestamp BETWEEN :from AND :to', {
        from: new Date(params.from),
        to: new Date(params.to),
      });
    } else if (params.from) {
      qb.andWhere('tx.timestamp >= :from', { from: new Date(params.from) });
    } else if (params.to) {
      qb.andWhere('tx.timestamp <= :to', { to: new Date(params.to) });
    }

    qb.orderBy('tx.timestamp', 'DESC');

    const paginated = await pagination<AttendanceTransactionEntity>(qb, {
      limit,
      offset,
    });

    const data = paginated.results.map((t) => this.toTransactionDto(t));

    return {
      results: data,
      totalItems: paginated.totalItems,
      offset: paginated.offset,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getTransactionById(
    id: string,
  ): Promise<AttendanceTransactionResponseDto> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return this.toTransactionDto(tx);
  }

  /**
   * Aggregated employee daily records (worked/late minutes, status) using utils pagination
   */
  async getDailySummary(
    query: DailySummaryQueryDto,
  ): Promise<PaginatedDailySummaryResponseDto> {
    const offset =
      query.offset && query.offset > 0
        ? Number(query.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      query.limit && query.limit > 0
        ? Number(query.limit)
        : DEFAULT_LIMIT_NUMBER;

    const targetDateStr =
      query.date || new Date().toISOString().slice(0, 10);
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // Fetch employees matching filters
    const empQb = this.employeeRepository.createQueryBuilder('employee');
    empQb.where('employee.deleted_at IS NULL');

    if (query.factoryId && query.factoryId !== 'ALL') {
      empQb.andWhere('employee.factoryId = :factoryId', {
        factoryId: query.factoryId,
      });
    }

    if (query.departmentId && query.departmentId !== 'ALL') {
      empQb.andWhere('employee.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    empQb.orderBy('employee.created_at');

    const paginatedEmployees = await pagination<EmployeeEntity>(empQb, {
      limit,
      offset,
    });

    const employees = paginatedEmployees.results;
    const empIds = employees.map((e) => e.id);

    // Fetch successful scans for these employees on that date
    let transactions: AttendanceTransactionEntity[] = [];
    if (empIds.length > 0) {
      transactions = await this.transactionRepository
        .createQueryBuilder('tx')
        .where('tx.employeeId IN (:...empIds)', { empIds })
        .andWhere('tx.status = :status', {
          status: ScanTransactionStatus.SUCCESS,
        })
        .andWhere('tx.timestamp BETWEEN :startOfDay AND :endOfDay', {
          startOfDay,
          endOfDay,
        })
        .orderBy('tx.timestamp', 'ASC')
        .getMany();
    }

    // Group transactions by employeeId
    const txByEmp = new Map<string, AttendanceTransactionEntity[]>();
    for (const tx of transactions) {
      if (!tx.employeeId) continue;
      const list = txByEmp.get(tx.employeeId) ?? [];
      list.push(tx);
      txByEmp.set(tx.employeeId, list);
    }

    const items: DailySummaryItemDto[] = employees.map((emp) => {
      const empTxs = txByEmp.get(emp.id) ?? [];
      const checkIns = empTxs.filter(
        (t) => t.eventType === AttendanceEventType.CHECK_IN,
      );
      const checkOuts = empTxs.filter(
        (t) => t.eventType === AttendanceEventType.CHECK_OUT,
      );

      const firstCheckIn = checkIns.length > 0 ? checkIns[0].timestamp : null;
      const lastCheckOut =
        checkOuts.length > 0
          ? checkOuts[checkOuts.length - 1].timestamp
          : null;

      let workedMinutes = 0;
      let lateMinutes = 0;
      let status: DailyAttendanceStatus = 'ABSENT';

      if (emp.employmentStatus === EmploymentStatus.ON_LEAVE) {
        status = 'ON_LEAVE';
      } else if (firstCheckIn) {
        const checkInDate = new Date(firstCheckIn);
        const checkInMinutes =
          checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes();

        if (checkInMinutes > this.shiftStartMinutes + this.lateThresholdMinutes) {
          lateMinutes =
            checkInMinutes - (this.shiftStartMinutes + this.lateThresholdMinutes);
          status = 'LATE';
        } else {
          status = 'PRESENT';
        }

        if (lastCheckOut) {
          const diffMs =
            new Date(lastCheckOut).getTime() - checkInDate.getTime();
          workedMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
        }
      }

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        departmentId: emp.departmentId,
        factoryId: emp.factoryId,
        date: targetDateStr,
        firstCheckIn: firstCheckIn
          ? new Date(firstCheckIn).toISOString().slice(11, 19)
          : null,
        lastCheckOut: lastCheckOut
          ? new Date(lastCheckOut).toISOString().slice(11, 19)
          : null,
        workedMinutes,
        lateMinutes,
        status,
      };
    });

    return {
      results: items,
      data: items,
      totalItems: paginatedEmployees.totalItems,
      total: paginatedEmployees.totalItems,
      offset: paginatedEmployees.offset,
      limit: paginatedEmployees.limit,
      totalPages: paginatedEmployees.totalPages,
    };
  }

  /**
   * Aggregated dashboard KPIs, trends, donuts & factory comparison
   */
  async getDashboard(factoryId?: string): Promise<DashboardResponseDto> {
    const todayStr = new Date().toISOString().slice(0, 10);
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999Z`);

    // Employee count
    const empQb = this.employeeRepository.createQueryBuilder('emp');
    empQb.where('emp.deleted_at IS NULL');
    if (factoryId && factoryId !== 'ALL') {
      empQb.andWhere('emp.factoryId = :factoryId', { factoryId });
    }
    const totalEmployees = await empQb.getCount();

    // Transactions today
    const txQb = this.transactionRepository.createQueryBuilder('tx');
    txQb.where('tx.timestamp BETWEEN :startOfToday AND :endOfToday', {
      startOfToday,
      endOfToday,
    });
    if (factoryId && factoryId !== 'ALL') {
      txQb.andWhere('tx.factoryId = :factoryId', { factoryId });
    }
    const todayTransactions = await txQb.getMany();

    const gateTrafficToday = todayTransactions.length;
    let deniedScansToday = 0;
    let checkInsToday = 0;
    let checkOutsToday = 0;
    const presentEmpSet = new Set<string>();
    const lateEmpSet = new Set<string>();
    const latestEventByEmp = new Map<
      string,
      { eventType: AttendanceEventType; timestamp: Date }
    >();

    for (const tx of todayTransactions) {
      if (tx.status === ScanTransactionStatus.DENIED) {
        deniedScansToday++;
      } else if (
        tx.status === ScanTransactionStatus.SUCCESS
      ) {
        if (tx.eventType === AttendanceEventType.CHECK_IN) {
          checkInsToday++;
          if (tx.employeeId) {
            presentEmpSet.add(tx.employeeId);
            const checkInDate = new Date(tx.timestamp);
            const checkInMinutes =
              checkInDate.getUTCHours() * 60 + checkInDate.getUTCMinutes();
            if (
              checkInMinutes >
              this.shiftStartMinutes + this.lateThresholdMinutes
            ) {
              lateEmpSet.add(tx.employeeId);
            }
          }
        } else if (tx.eventType === AttendanceEventType.CHECK_OUT) {
          checkOutsToday++;
        }

        if (tx.employeeId) {
          const currentLatest = latestEventByEmp.get(tx.employeeId);
          const txTime = new Date(tx.timestamp).getTime();
          if (!currentLatest || txTime >= currentLatest.timestamp.getTime()) {
            latestEventByEmp.set(tx.employeeId, {
              eventType: tx.eventType,
              timestamp: new Date(tx.timestamp),
            });
          }
        }
      }
    }

    const deniedToday = deniedScansToday;

    let insideNow = 0;
    for (const record of latestEventByEmp.values()) {
      if (record.eventType === AttendanceEventType.CHECK_IN) {
        insideNow++;
      }
    }

    const presentToday = presentEmpSet.size;
    const lateToday = lateEmpSet.size;

    // On-leave count
    const onLeaveQb = this.employeeRepository.createQueryBuilder('emp');
    onLeaveQb.where('emp.deleted_at IS NULL');
    onLeaveQb.andWhere('emp.employmentStatus = :status', {
      status: EmploymentStatus.ON_LEAVE,
    });
    if (factoryId && factoryId !== 'ALL') {
      onLeaveQb.andWhere('emp.factoryId = :factoryId', { factoryId });
    }
    const onLeaveToday = await onLeaveQb.getCount();

    const absentToday = Math.max(
      0,
      totalEmployees - presentToday - onLeaveToday,
    );

    const attendanceRate =
      totalEmployees > 0
        ? Math.round((presentToday / totalEmployees) * 1000) / 10
        : 100;

    const onTimeToday = Math.max(0, presentToday - lateToday);

    const kpis = {
      totalEmployees,
      presentToday,
      insideNow,
      checkInsToday,
      checkOutsToday,
      deniedToday,
      lateToday,
      onLeaveToday,
      absentToday,
      gateTrafficToday,
      deniedScansToday,
      attendanceRate,
    };

    // Trend: Daily check-ins and check-outs over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const trendMap = new Map<string, { checkIns: number; checkOuts: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      trendMap.set(dateStr, { checkIns: 0, checkOuts: 0 });
    }

    const trendQb = this.transactionRepository.createQueryBuilder('tx');
    trendQb.where('tx.timestamp BETWEEN :sevenDaysAgo AND :endOfToday', {
      sevenDaysAgo,
      endOfToday,
    });
    trendQb.andWhere('tx.status = :successStatus', {
      successStatus: ScanTransactionStatus.SUCCESS,
    });
    if (factoryId && factoryId !== 'ALL') {
      trendQb.andWhere('tx.factoryId = :factoryId', { factoryId });
    }
    const trendTransactions = await trendQb.getMany();

    for (const tx of trendTransactions) {
      const dateStr = new Date(tx.timestamp).toISOString().slice(0, 10);
      const entry = trendMap.get(dateStr);
      if (entry) {
        if (tx.eventType === AttendanceEventType.CHECK_IN) {
          entry.checkIns++;
        } else if (tx.eventType === AttendanceEventType.CHECK_OUT) {
          entry.checkOuts++;
        }
      }
    }

    const trend: AttendanceTrendItemDto[] = Array.from(trendMap.entries()).map(
      ([date, counts]) => ({
        date,
        checkIns: counts.checkIns,
        checkOuts: counts.checkOuts,
      }),
    );

    // Distribution: Status breakdown for today
    const distribution: AttendanceDistributionItemDto[] = [
      {
        name: 'On Time',
        value: onTimeToday,
        status: AttendanceStatus.PRESENT,
      },
      {
        name: 'Late',
        value: lateToday,
        status: AttendanceStatus.LATE,
      },
      {
        name: 'On Leave',
        value: onLeaveToday,
        status: AttendanceStatus.ON_LEAVE,
      },
      {
        name: 'Absent',
        value: absentToday,
        status: AttendanceStatus.ABSENT,
      },
    ];

    // Factory breakdown & comparison
    const factories = await this.factoryRepository.find();
    const factoryComparison: FactoryComparisonItemDto[] = [];
    const factoryBreakdown: FactoryBreakdownItemDto[] = [];

    for (const f of factories) {
      const fTotal = await this.employeeRepository.count({
        where: { factoryId: f.id as any },
      });
      const fPresent = Array.from(presentEmpSet).filter(
        (eId) =>
          eId.startsWith(`TMC-${f.code}-`) ||
          eId.startsWith(`TMC-${f.id}-`),
      ).length;
      const fRate =
        fTotal > 0 ? Math.round((fPresent / fTotal) * 1000) / 10 : 100;

      const fTxs = todayTransactions.filter(
        (tx) =>
          tx.factoryId === f.id ||
          tx.factoryId === f.code ||
          (tx.employeeId &&
            (tx.employeeId.includes(`-${f.code}-`) ||
              tx.employeeId.includes(`-${f.id}-`))),
      );

      const fCheckIns = fTxs.filter(
        (tx) =>
          tx.status === ScanTransactionStatus.SUCCESS &&
          tx.eventType === AttendanceEventType.CHECK_IN,
      ).length;

      const fDenied = fTxs.filter(
        (tx) => tx.status === ScanTransactionStatus.DENIED,
      ).length;

      factoryComparison.push({
        factoryId: (f.code || f.id) as FactoryId,
        factoryName: f.name,
        attendanceRate: fRate,
        checkIns: fCheckIns,
        denied: fDenied,
      });

      factoryBreakdown.push({
        factoryId: f.id,
        factoryName: f.name,
        factoryCode: f.code,
        totalEmployees: fTotal,
        presentToday: fPresent,
        attendanceRate: fRate,
      });
    }

    // Gate distribution
    const gates = await this.gateRepository.find();
    const gateCountMap = new Map<string, number>();
    for (const tx of todayTransactions) {
      gateCountMap.set(tx.gateId, (gateCountMap.get(tx.gateId) ?? 0) + 1);
    }

    const gateDistribution: GateTrafficDistributionDto[] = gates.map((g) => ({
      gateId: g.id,
      gateName: g.name,
      totalScans: gateCountMap.get(g.id) ?? 0,
    }));

    // Recent 10 transactions
    const recentActivityEntities = await this.transactionRepository.find({
      order: { timestamp: 'DESC' },
      take: 10,
    });
    const recentEvents = recentActivityEntities.map((t) =>
      this.toTransactionDto(t),
    );

    return {
      kpis,
      trend,
      distribution,
      recentEvents,
      factoryComparison,
      // Backward compatibility fields
      attendanceRate,
      factoryBreakdown,
      gateDistribution,
      recentActivity: recentEvents,
    };
  }

  toTransactionDto(
    entity: AttendanceTransactionEntity,
  ): AttendanceTransactionResponseDto {
    return {
      id: entity.id,
      employeeId: entity.employeeId ?? null,
      employeeName: entity.employee?.fullName ?? null,
      employeeCode: entity.employee?.code ?? null,
      factoryCode: entity.employee?.factory?.code ?? null,
      factoryName: entity.employee?.factory?.name ?? null,
      departmentId: entity.employee?.departmentId ?? null,
      departmentName: entity.employee?.department?.name ?? null,
      gateId: entity.gateId,
      gateCode: entity.gate?.code ?? null,
      gateName: entity.gate?.name ?? null,
      eventType: entity.eventType,
      timestamp: entity.timestamp,
      qrValidation: entity.qrValidation,
      status: entity.status,
      denialReason: entity.denialReason ?? null,
      errorMessage: entity.errorMessage ?? null,
      synced: entity.synced,
    };
  }
}

