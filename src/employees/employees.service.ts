import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { FactoryEntity, FactoryStatus } from '../entities/factory.entity';
import { pagination } from '../utils/common/handle';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmploymentStatusDto } from './dto/update-status.dto';
import {
  EmployeeDetailResponseDto,
  EmployeeResponseDto,
  PaginatedEmployeesResponseDto,
  QrCodeResponseDto,
} from './dto/employee-response.dto';
import { EmploymentStatus } from './enums/employment-status.enum';
import { FactoryCode } from './enums/factory.enum';
import { QrStatus } from './enums/qr-status.enum';
import { Gender } from './enums/gender.enum';
import * as crypto from 'crypto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(QrCodeEntity)
    private readonly qrCodeRepository: Repository<QrCodeEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(FactoryEntity)
    private readonly factoryRepository: Repository<FactoryEntity>,
  ) {}

  async list(params: ListEmployeesDto): Promise<PaginatedEmployeesResponseDto> {
    const page =
      params.page && params.page > 0
        ? Number(params.page)
        : params.offset && params.offset > 0
          ? Number(params.offset)
          : DEFAULT_PAGE_NUMBER;
    const pageSize =
      params.pageSize && params.pageSize > 0
        ? Number(params.pageSize)
        : params.limit && params.limit > 0
          ? Number(params.limit)
          : DEFAULT_LIMIT_NUMBER;

    const qb = this.employeeRepository.createQueryBuilder('employee');
    qb.where('employee.deletedAt IS NULL');

    if (params.q) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(employee.fullName) LIKE :q OR LOWER(employee.id) LIKE :q OR LOWER(employee.email) LIKE :q)',
        { q },
      );
    }

    if (params.factoryId && params.factoryId !== 'ALL') {
      qb.andWhere('employee.factoryId = :factoryId', {
        factoryId: params.factoryId,
      });
    }

    if (params.departmentId && params.departmentId !== 'ALL') {
      qb.andWhere('employee.departmentId = :departmentId', {
        departmentId: params.departmentId,
      });
    }

    if (params.employmentStatus && params.employmentStatus !== 'ALL') {
      qb.andWhere('employee.employmentStatus = :employmentStatus', {
        employmentStatus: params.employmentStatus,
      });
    }

    qb.orderBy('employee.id', 'ASC');

    const paginated = await pagination<EmployeeEntity>(qb, {
      limit: pageSize,
      offset: page,
    });

    const employees = paginated.results;

    // Map latest QR statuses for the current page
    const employeeIds = employees.map((e) => e.id);
    const qrMap = new Map<string, QrStatus>();

    if (employeeIds.length > 0) {
      const qrs = await this.qrCodeRepository
        .createQueryBuilder('qr')
        .where('qr.employeeId IN (:...employeeIds)', { employeeIds })
        .orderBy('qr.createdAt', 'DESC')
        .getMany();

      for (const qr of qrs) {
        if (!qrMap.has(qr.employeeId)) {
          qrMap.set(qr.employeeId, qr.status);
        }
      }
    }

    const data: EmployeeResponseDto[] = employees.map((emp) =>
      this.toResponseDto(emp, qrMap.get(emp.id) ?? null),
    );

    return {
      data,
      total: paginated.totalItems,
      page: paginated.offset,
      pageSize: paginated.limit,
      limit: paginated.limit,
      results: data,
      totalItems: paginated.totalItems,
      offset: paginated.offset,
      totalPages: paginated.totalPages,
    };
  }

  async getById(id: string): Promise<EmployeeDetailResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const latestQr = await this.qrCodeRepository.findOne({
      where: { employeeId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      employee: this.toResponseDto(employee, latestQr?.status ?? null),
      qrCode: latestQr ? this.toQrCodeResponseDto(latestQr) : null,
      attendanceHistory: [],
      recentEvents: [],
    };
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    // Check if email exists
    const existing = await this.employeeRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(
        `Employee with email ${dto.email} already exists`,
      );
    }

    const factory = await this.factoryRepository.findOne({
      where: { id: dto.factoryId },
    });

    if (!factory) {
      throw new NotFoundException(`Factory with ID ${dto.factoryId} not found`);
    }

    const departmentName = await this.resolveDepartmentName(
      dto.departmentId,
      factory.id,
    );

    // Auto-generate employee ID: TMC-{factoryCode}-{seq}
    const id = await this.generateNextEmployeeId(factory.code);

    const employee = this.employeeRepository.create({
      id,
      fullName: dto.fullName.trim(),
      departmentId: dto.departmentId,
      departmentName,
      position: dto.position.trim(),
      factoryId: dto.factoryId,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone.trim(),
      employmentStatus: EmploymentStatus.PROBATION,
      hireDate: dto.hireDate,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
    });

    const savedEmployee = await this.employeeRepository.save(employee);

    // Auto-generate initial active QR code
    await this.generateInitialQrCode(savedEmployee);

    return this.toResponseDto(savedEmployee, QrStatus.ACTIVE);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (dto.email && dto.email.toLowerCase() !== employee.email.toLowerCase()) {
      const existing = await this.employeeRepository.findOne({
        where: { email: dto.email.toLowerCase() },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Employee with email ${dto.email} already exists`,
        );
      }
      employee.email = dto.email.toLowerCase();
    }

    if (dto.departmentId) {
      employee.departmentId = dto.departmentId;
      employee.departmentName = await this.resolveDepartmentName(
        dto.departmentId,
        dto.factoryId || employee.factoryId,
      );
    }

    if (dto.position) employee.position = dto.position.trim();
    if (dto.factoryId) employee.factoryId = dto.factoryId;
    if (dto.phone) employee.phone = dto.phone.trim();
    if (dto.hireDate) employee.hireDate = dto.hireDate;
    if (dto.dateOfBirth) employee.dateOfBirth = dto.dateOfBirth;
    if (dto.gender) employee.gender = dto.gender;

    const updated = await this.employeeRepository.save(employee);
    const latestQr = await this.qrCodeRepository.findOne({
      where: { employeeId: id },
      order: { createdAt: 'DESC' },
    });

    return this.toResponseDto(updated, latestQr?.status ?? null);
  }

  async updateStatus(
    id: string,
    dto: UpdateEmploymentStatusDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    employee.employmentStatus = dto.employmentStatus;
    const updated = await this.employeeRepository.save(employee);

    // Sync QR code status according to employment status
    if (dto.employmentStatus === EmploymentStatus.TERMINATED) {
      await this.qrCodeRepository.update(
        { employeeId: id, status: QrStatus.ACTIVE },
        { status: QrStatus.REVOKED },
      );
    } else if (dto.employmentStatus === EmploymentStatus.SUSPENDED) {
      await this.qrCodeRepository.update(
        { employeeId: id, status: QrStatus.ACTIVE },
        { status: QrStatus.SUSPENDED },
      );
    }

    const latestQr = await this.qrCodeRepository.findOne({
      where: { employeeId: id },
      order: { createdAt: 'DESC' },
    });

    return this.toResponseDto(updated, latestQr?.status ?? null);
  }

  async delete(id: string): Promise<{ message: string }> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Revoke active QR code
    await this.qrCodeRepository.update(
      { employeeId: id, status: QrStatus.ACTIVE },
      { status: QrStatus.REVOKED },
    );

    // Set status to terminated and soft delete
    employee.employmentStatus = EmploymentStatus.TERMINATED;
    await this.employeeRepository.save(employee);
    await this.employeeRepository.softDelete(id);

    return { message: 'Employee deleted successfully' };
  }

  private async generateNextEmployeeId(factoryCode: string): Promise<string> {
    // Find highest sequence number for this factoryId
    const prefix = `TMC-${factoryCode}-`;
    const employees = await this.employeeRepository
      .createQueryBuilder('employee')
      .withDeleted()
      .where('employee.id LIKE :prefix', { prefix: `${prefix}%` })
      .getMany();

    let maxSeq = 0;
    for (const emp of employees) {
      const parts = emp.id.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  private async generateInitialQrCode(
    employee: EmployeeEntity,
  ): Promise<QrCodeEntity> {
    const qrId = `QR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const tokenUuid = crypto.randomUUID();
    const payload = `tmc://v1/${employee.factoryId.toLowerCase()}/token-${tokenUuid}`;
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const qr = this.qrCodeRepository.create({
      id: qrId,
      employeeId: employee.id,
      factoryId: employee.factoryId,
      status: QrStatus.ACTIVE,
      payload,
      expiresAt,
      lastUsedAt: null,
    });

    return this.qrCodeRepository.save(qr);
  }

  private async resolveDepartmentName(
    departmentId: string,
    factoryId?: string,
  ): Promise<string> {
    const where: any = { id: departmentId };
    if (factoryId) where.factoryId = factoryId;
    const dept = await this.departmentRepository.findOne({ where });
    if (dept) return dept.name;

    // Derived fallback name from ID (e.g. BD-PROD -> Production)
    return departmentId.split('-')[1] || departmentId;
  }

  private toResponseDto(
    emp: EmployeeEntity,
    qrStatus: QrStatus | null,
  ): EmployeeResponseDto {
    return {
      id: emp.id,
      fullName: emp.fullName,
      departmentId: emp.departmentId,
      departmentName: emp.departmentName,
      position: emp.position,
      factoryCode: emp.factory.code,
      email: emp.email,
      phone: emp.phone,
      employmentStatus: emp.employmentStatus,
      hireDate: emp.hireDate,
      dateOfBirth: emp.dateOfBirth,
      gender: emp.gender,
      qrStatus,
    };
  }

  private toQrCodeResponseDto(qr: QrCodeEntity): QrCodeResponseDto {
    return {
      id: qr.id,
      employeeId: qr.employeeId,
      factoryCode: qr.factory.code,
      factoryId: qr.factory.id,
      status: qr.status,
      createdAt: qr.createdAt,
      expiresAt: qr.expiresAt,
      lastUsedAt: qr.lastUsedAt || null,
      payload: qr.payload,
    };
  }

}
