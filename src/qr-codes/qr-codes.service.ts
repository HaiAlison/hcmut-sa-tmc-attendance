import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { UserEntity } from '../entities/user.entity';
import {
  IQrTokenGenerator,
  QR_TOKEN_GENERATOR,
} from './interfaces/qr-token-generator.interface';
import { pagination } from '../utils/common/handle';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { ListQrCodesDto } from './dto/list-qr-codes.dto';
import { GenerateQrDto } from './dto/generate-qr.dto';
import { UpdateQrStatusDto } from './dto/update-qr-status.dto';
import {
  PaginatedQrCodesResponseDto,
  QrCodeResponseDto,
} from './dto/qr-code-response.dto';
import { QrStatus } from '../employees/enums/qr-status.enum';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class QrCodesService {
  constructor(
    @InjectRepository(QrCodeEntity)
    private readonly qrCodeRepository: Repository<QrCodeEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject(QR_TOKEN_GENERATOR)
    private readonly tokenGenerator: IQrTokenGenerator,
  ) {}

  async list(params: ListQrCodesDto): Promise<PaginatedQrCodesResponseDto> {
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

    const qb = this.qrCodeRepository.createQueryBuilder('qr');

    if (params.q) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(qr.employeeId) LIKE :q OR LOWER(qr.employeeName) LIKE :q OR LOWER(qr.id) LIKE :q)',
        { q },
      );
    }

    if (params.factoryId && params.factoryId !== 'ALL') {
      qb.andWhere('qr.factoryId = :factoryId', { factoryId: params.factoryId });
    }

    if (params.status && params.status !== 'ALL') {
      qb.andWhere('qr.status = :status', { status: params.status });
    }

    qb.orderBy('qr.createdAt', 'DESC');

    const paginated = await pagination<QrCodeEntity>(qb, {
      limit: pageSize,
      offset: page,
    });

    const data = paginated.results.map((r) => this.toResponseDto(r));

    return {
      data,
      total: paginated.totalItems,
      page: paginated.offset,
      pageSize: paginated.limit,
      results: data,
      totalItems: paginated.totalItems,
      offset: paginated.offset,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getById(id: string): Promise<QrCodeResponseDto> {
    const qr = await this.qrCodeRepository.findOne({
      where: { id },
    });

    if (!qr) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    return this.toResponseDto(qr);
  }

  async getByEmployeeId(employeeId: string): Promise<QrCodeResponseDto> {
    const qr = await this.qrCodeRepository.findOne({
      where: { employeeId, status: QrStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!qr) {
      throw new NotFoundException(
        `No active QR code found for employee ${employeeId}`,
      );
    }

    return this.toResponseDto(qr);
  }

  async getMyQr(
    userId: string,
    linkedEmployeeId?: string | null,
    userEmail?: string,
  ): Promise<QrCodeResponseDto> {
    let empId = linkedEmployeeId;

    if (!empId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      empId = user?.linkedEmployeeId;
    }

    if (!empId && userEmail) {
      const emp = await this.employeeRepository.findOne({
        where: { email: userEmail.toLowerCase() },
      });
      empId = emp?.id;
    }

    if (!empId) {
      throw new BadRequestException(
        'User account is not linked to any employee record',
      );
    }

    return this.getByEmployeeId(empId);
  }

  async generate(dto: GenerateQrDto): Promise<QrCodeResponseDto> {
    const { employeeId } = dto;
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Revoke any previous active QR code for this employee
    await this.qrCodeRepository.update(
      { employeeId, status: QrStatus.ACTIVE },
      { status: QrStatus.REVOKED },
    );

    // Generate fresh token via generator strategy
    const generated = this.tokenGenerator.generateToken(employee.factoryId);

    const qr = this.qrCodeRepository.create({
      id: generated.id,
      employeeId: employee.id,
      factoryId: employee.factoryId,
      status: QrStatus.ACTIVE,
      payload: generated.payload,
      expiresAt: generated.expiresAt,
      lastUsedAt: null,
    });

    const saved = await this.qrCodeRepository.save(qr);
    return this.toResponseDto(saved);
  }

  async regenerate(
    id: string,
    userSub?: string,
    userRole?: UserRole,
  ): Promise<QrCodeResponseDto> {
    const existing = await this.qrCodeRepository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    // If an EMPLOYEE requests regeneration, ensure it is their own QR code
    if (userRole === UserRole.EMPLOYEE && userSub) {
      const user = await this.userRepository.findOne({
        where: { id: userSub },
      });
      if (
        user?.linkedEmployeeId &&
        user.linkedEmployeeId !== existing.employeeId
      ) {
        throw new ForbiddenException(
          'Employees can only rotate their own QR code badge',
        );
      }
    }

    return this.generate({ employeeId: existing.employeeId });
  }

  async updateStatus(
    id: string,
    dto: UpdateQrStatusDto,
  ): Promise<QrCodeResponseDto> {
    const qr = await this.qrCodeRepository.findOne({
      where: { id },
    });

    if (!qr) {
      throw new NotFoundException(`QR code with ID ${id} not found`);
    }

    qr.status = dto.status;
    const updated = await this.qrCodeRepository.save(qr);
    return this.toResponseDto(updated);
  }

  async revoke(id: string): Promise<QrCodeResponseDto> {
    return this.updateStatus(id, { status: QrStatus.REVOKED });
  }

  private toResponseDto(qr: QrCodeEntity): QrCodeResponseDto {
    return {
      id: qr.id,
      employeeId: qr.employeeId,
      factoryCode: qr.factory?.code,
      status: qr.status,
      createdAt: qr.createdAt,
      expiresAt: qr.expiresAt,
      lastUsedAt: qr.lastUsedAt || null,
      payload: qr.payload,
    };
  }
}
