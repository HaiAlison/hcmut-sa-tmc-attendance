import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { EmployeeEntity } from './employee.entity';

@Entity('users')
export class UserEntity extends BaseTimeStampEntity {

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'linked_employee_id', type: 'varchar', nullable: true })
  linkedEmployeeId?: string | null;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'linked_employee_id' })
  employee?: EmployeeEntity;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin?: Date | null;
}
