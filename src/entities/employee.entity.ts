import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn
} from 'typeorm';
import { EmploymentStatus } from '../employees/enums/employment-status.enum';
import { Gender } from '../employees/enums/gender.enum';
import { QrCodeEntity } from './qr-code.entity';
import { AttendanceTransactionEntity } from './attendance-transaction.entity';
import { FactoryEntity } from './factory.entity';

@Entity('employees')
export class EmployeeEntity extends BaseTimeStampEntity {
  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Column({ name: 'department_id', type: 'varchar', length: 32 })
  departmentId: string;

  @Column({ name: 'department_name', type: 'varchar', length: 100 })
  departmentName: string;

  @Column({ type: 'varchar', length: 100 })
  position: string;

  @Column({ name: 'factory_id', type: 'varchar' })
  factoryId: string;

  @ManyToOne(() => FactoryEntity, (factory) => factory.employees)
  @JoinColumn({ name: 'factory_id' })
  factory: FactoryEntity;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({
    name: 'employment_status',
    type: 'varchar',
    length: 32,
    default: EmploymentStatus.ACTIVE,
  })
  employmentStatus: EmploymentStatus;

  @Column({ name: 'hire_date', type: 'date' })
  hireDate: Date;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 8 })
  gender: Gender;

  @OneToMany(() => QrCodeEntity, (qrCode) => qrCode.employee)
  qrCodes: QrCodeEntity[];

  @OneToMany(() => AttendanceTransactionEntity, (transaction) => transaction.employee)
  attendanceTransactions: AttendanceTransactionEntity[];
}
