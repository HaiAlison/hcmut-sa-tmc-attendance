import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultUsers();
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

  private async seedDefaultUsers(): Promise<void> {
    try {
      const defaultPassword = await bcrypt.hash('admin123', 10);
      const testPassword = await bcrypt.hash('string', 10);

      const seedUsers: Partial<UserEntity>[] = [
        {
          id: 'USR-001',
          name: 'Nguyen Van Admin',
          email: 'admin@tmc.com',
          password: testPassword,
          role: UserRole.SYSTEM_ADMIN,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-BD-0001',
        },
        {
          id: 'USR-002',
          name: 'Tran Thi Bich',
          email: 'bich.tran@tmc.com.vn',
          password: defaultPassword,
          role: UserRole.HR_STAFF,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-BD-0002',
        },
        {
          id: 'USR-003',
          name: 'Le Van Canh',
          email: 'canh.le@tmc.com.vn',
          password: defaultPassword,
          role: UserRole.SECURITY_GUARD,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-BD-0003',
        },
        {
          id: 'USR-004',
          name: 'Pham Thi Dao',
          email: 'dao.pham@tmc.com.vn',
          password: defaultPassword,
          role: UserRole.PRODUCTION_SUPERVISOR,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-LA-0001',
        },
        {
          id: 'USR-005',
          name: 'Hoang Van Em',
          email: 'em.hoang@tmc.com.vn',
          password: defaultPassword,
          role: UserRole.EXECUTIVE_MANAGEMENT,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-BD-0005',
        },
        {
          id: 'USR-006',
          name: 'Do Thi Giang',
          email: 'giang.do@tmc.com.vn',
          password: defaultPassword,
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
          linkedEmployeeId: 'TMC-BD-0006',
        },
      ];

      for (const u of seedUsers) {
        if (!u.email) continue;
        const existing = await this.findByEmail(u.email);
        if (!existing) {
          const newUser = this.userRepository.create(u);
          await this.userRepository.save(newUser);
          this.logger.log(`Seeded user: ${u.email} (${u.role})`);
        } else if (
          existing.role !== u.role ||
          existing.linkedEmployeeId !== u.linkedEmployeeId
        ) {
          if (u.role) existing.role = u.role;
          if (u.linkedEmployeeId !== undefined) {
            existing.linkedEmployeeId = u.linkedEmployeeId;
          }
          await this.userRepository.save(existing);
          this.logger.log(`Updated user: ${u.email} (${u.role})`);
        }
      }
    } catch (err: any) {
      this.logger.warn(
        `User seeding skipped or encountered error: ${err.message}`,
      );
    }
  }
}
