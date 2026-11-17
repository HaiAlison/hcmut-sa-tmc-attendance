import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttendanceTransactionEntity,
  ScanTransactionStatus,
} from '../entities/attendance-transaction.entity';
import { GateEntity, GateStatus } from '../entities/gate.entity';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { pagination } from '../utils/common/handle';
import { CreateGateDto } from './dto/create-gate.dto';
import {
  GateDetailResponseDto,
  GateResponseDto,
  PaginatedGatesResponseDto,
} from './dto/gate-response.dto';
import { ListGatesDto } from './dto/list-gates.dto';
import { UpdateGateStatusDto } from './dto/update-gate-status.dto';
import { UpdateGateDto } from './dto/update-gate.dto';

@Injectable()
export class GatesService {
  private readonly logger = new Logger(GatesService.name);

  constructor(
    @InjectRepository(GateEntity)
    private readonly gateRepository: Repository<GateEntity>,
    @InjectRepository(AttendanceTransactionEntity)
    private readonly transactionRepository: Repository<AttendanceTransactionEntity>,
  ) {}


  async list(params: ListGatesDto): Promise<PaginatedGatesResponseDto> {
    const offset =
      params.offset && params.offset > 0
        ? Number(params.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      params.limit && params.limit > 0
        ? Number(params.limit)
        : DEFAULT_LIMIT_NUMBER;

    const qb = this.gateRepository.createQueryBuilder('gate');

    if (params.q) {
      qb.andWhere('(gate.name ILIKE :q OR gate.code ILIKE :q)', { q: `%${params.q}%` });
    }
    if (params.factoryId && params.factoryId !== 'ALL') {
      qb.andWhere('gate.factoryId = :factoryId', {
        factoryId: params.factoryId,
      });
    }

    if (params.type && params.type !== 'ALL') {
      qb.andWhere('gate.type = :type', { type: params.type });
    }

    if (params.status && params.status !== 'ALL') {
      qb.andWhere('gate.status = :status', { status: params.status });
    }

    qb.orderBy('gate.id', 'ASC');

    const paginated = await pagination<GateEntity>(qb, {
      limit,
      offset,
    });

    const data = paginated.results.map((g) => this.toResponseDto(g));

    return {
      results: data,
      totalItems: paginated.totalItems,
      offset: paginated.offset,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getById(id: string): Promise<GateDetailResponseDto> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate station with ID ${id} not found`);
    }

    // Recent 20 events at this gate
    const recentEvents = await this.transactionRepository.find({
      where: { gateId: id },
      order: { timestamp: 'DESC' },
      take: 20,
    });

    // 7-day stats
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const past7DaysTransactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.gateId = :id', { id })
      .andWhere('tx.timestamp >= :sevenDaysAgo', { sevenDaysAgo })
      .getMany();

    let successfulScans = 0;
    let deniedScans = 0;
    const dailyMap = new Map<string, { success: number; denied: number }>();

    // Initialize 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      dailyMap.set(dateStr, { success: 0, denied: 0 });
    }

    for (const tx of past7DaysTransactions) {
      const dateStr = new Date(tx.timestamp).toISOString().slice(0, 10);
      const counts = dailyMap.get(dateStr) ?? { success: 0, denied: 0 };
      if (tx.status === ScanTransactionStatus.SUCCESS) {
        successfulScans++;
        counts.success++;
      } else {
        deniedScans++;
        counts.denied++;
      }
      dailyMap.set(dateStr, counts);
    }

    const dailyBreakdown = Array.from(dailyMap.entries()).map(
      ([date, counts]) => ({
        date,
        success: counts.success,
        denied: counts.denied,
      }),
    );

    return {
      gate: this.toResponseDto(gate),
      stats7Days: {
        totalScans: past7DaysTransactions.length,
        successfulScans,
        deniedScans,
        dailyBreakdown,
      },
      recentEvents,
    };
  }

  async create(dto: CreateGateDto): Promise<GateResponseDto> {
    let code = dto.code;
    if (!code) {
      const count = await this.gateRepository.count({
        where: { factoryId: dto.factoryId },
      });
      const seq = String(count + 1).padStart(2, '0');
      code = `GATE-${dto.factoryId}-${seq}`;
    }

    const existing = await this.gateRepository.findOne({
      where: { code: code },
    });
    if (existing) {
      throw new ConflictException(`Gate station code ${code} already exists`);
    }

    const gate = this.gateRepository.create({
      code,
      name: dto.name,
      factoryId: dto.factoryId,
      type: dto.type,
      location: dto.location,
      ipAddress: dto.ipAddress ?? null,
      macAddress: dto.macAddress ?? null,
      firmwareVersion: dto.firmwareVersion ?? null,
      status: dto.status ?? GateStatus.ONLINE,
      lastHeartbeatAt: new Date(),
    });

    const saved = await this.gateRepository.save(gate);
    return this.toResponseDto(saved);
  }

  async update(id: string, dto: UpdateGateDto): Promise<GateResponseDto> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate station with ID ${id} not found`);
    }

    if (dto.name !== undefined) gate.name = dto.name;
    if (dto.location !== undefined) gate.location = dto.location;
    if (dto.type !== undefined) gate.type = dto.type;
    if (dto.ipAddress !== undefined) gate.ipAddress = dto.ipAddress;
    if (dto.firmwareVersion !== undefined)
      gate.firmwareVersion = dto.firmwareVersion;

    const saved = await this.gateRepository.save(gate);
    return this.toResponseDto(saved);
  }

  async updateStatus(
    id: string,
    dto: UpdateGateStatusDto,
  ): Promise<GateResponseDto> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate station with ID ${id} not found`);
    }

    gate.status = dto.status;
    const saved = await this.gateRepository.save(gate);
    return this.toResponseDto(saved);
  }

  async heartbeat(id: string): Promise<GateResponseDto> {
    const gate = await this.gateRepository.findOne({ where: { id } });
    if (!gate) {
      throw new NotFoundException(`Gate station with ID ${id} not found`);
    }

    gate.lastHeartbeatAt = new Date();
    if (gate.status === GateStatus.OFFLINE) {
      gate.status = GateStatus.ONLINE;
    }

    const saved = await this.gateRepository.save(gate);
    return this.toResponseDto(saved);
  }

  toResponseDto(gate: GateEntity): GateResponseDto {
    return {
      id: gate.id,
      code: gate.code,
      name: gate.name,
      factoryId: gate.factoryId,
      type: gate.type,
      status: gate.status,
      location: gate.location,
      ipAddress: gate.ipAddress ?? null,
      macAddress: gate.macAddress ?? null,
      firmwareVersion: gate.firmwareVersion ?? null,
      lastHeartbeatAt: gate.lastHeartbeatAt ?? null,
    };
  }

}

