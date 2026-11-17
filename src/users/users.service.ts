import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import {
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { pagination } from '../utils/common/handle';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminUser();
  }

  async seedAdminUser(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tmc.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'string';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail.toLowerCase() },
      withDeleted: true,
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = this.userRepository.create({
        name: 'Nguyen Van Admin',
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: UserRole.SYSTEM_ADMIN,
        status: UserStatus.ACTIVE,
      });

      await this.userRepository.save(admin);
      this.logger.log(`Seeded default admin user: ${adminEmail}`);
    }

    // Seed default employee account for testing/demo if not present
    const empEmail = 'giang.do@tmc.com.vn';
    const existingEmp = await this.userRepository.findOne({
      where: { email: empEmail },
      withDeleted: true,
    });

    if (!existingEmp) {
      const hashedEmpPassword = await bcrypt.hash('admin123', 10);
      const empUser = this.userRepository.create({
        name: 'Giang Do',
        email: empEmail,
        password: hashedEmpPassword,
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
      });

      await this.userRepository.save(empUser);
      this.logger.log(`Seeded default test employee user: ${empEmail}`);
    }
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: dto.role || UserRole.EMPLOYEE,
      status: dto.status || UserStatus.ACTIVE,
      linkedEmployeeId: dto.linkedEmployeeId || null,
    });

    const saved = await this.userRepository.save(user);
    return this.toResponseDto(saved);
  }

  async findAll(params: ListUsersDto): Promise<PaginatedUsersResponseDto> {
    const offset =
      params.offset && params.offset > 0
        ? Number(params.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      params.limit && params.limit > 0
        ? Number(params.limit)
        : DEFAULT_LIMIT_NUMBER;

    const qb = this.userRepository.createQueryBuilder('user');
    qb.where('user.deleted_at IS NULL');

    if (params.q) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(user.name) LIKE :q OR LOWER(user.email) LIKE :q)',
        { q },
      );
    }

    if (params.role) {
      qb.andWhere('user.role = :role', { role: params.role });
    }

    if (params.status) {
      qb.andWhere('user.status = :status', { status: params.status });
    }

    qb.orderBy('user.id', 'ASC');

    const paginated = await pagination<UserEntity>(qb, {
      limit,
      offset,
    });

    const data = paginated.results.map((u) => this.toResponseDto(u));

    return {
      results: data,
      data,
      totalItems: paginated.totalItems,
      total: paginated.totalItems,
      offset: paginated.offset,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toResponseDto(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const existing = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        withDeleted: true,
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `User with email ${dto.email} already exists`,
        );
      }
      user.email = normalizedEmail;
    }

    if (dto.name) user.name = dto.name.trim();
    if (dto.role) user.role = dto.role;
    if (dto.status) user.status = dto.status;
    if (dto.linkedEmployeeId !== undefined) {
      user.linkedEmployeeId = dto.linkedEmployeeId;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.userRepository.save(user);
    return this.toResponseDto(updated);
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.softDelete(id);
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserEntity | null> {
    const qb = this.userRepository.createQueryBuilder('user');
    qb.where('LOWER(user.email) = LOWER(:email)', { email });

    if (includePassword) {
      qb.addSelect('user.password').addSelect('user.refreshTokenHash');
    }

    return qb.getOne();
  }

  async findById(
    id: string,
    includeRefreshToken = false,
  ): Promise<UserEntity | null> {
    const qb = this.userRepository.createQueryBuilder('user');
    qb.where('user.id = :id', { id });

    if (includeRefreshToken) {
      qb.addSelect('user.refreshTokenHash');
    }

    return qb.getOne();
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update({ id: userId }, { refreshTokenHash });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { lastLogin: new Date() });
  }

  toResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      linkedEmployeeId: user.linkedEmployeeId || null,
      lastLogin: user.lastLogin || null,
      createdAt: user.created_at,
    };
  }
}
