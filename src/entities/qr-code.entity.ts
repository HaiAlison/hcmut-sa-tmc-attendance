import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn
} from 'typeorm';
import { QrStatus } from '../employees/enums/qr-status.enum';
import { EmployeeEntity } from './employee.entity';
import { FactoryEntity } from './factory.entity';

@Entity('qr_codes')
export class QrCodeEntity extends BaseTimeStampEntity {

  @Index()
  @Column({ type: 'varchar' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.qrCodes)
  employee: EmployeeEntity;

  @ManyToOne(() => FactoryEntity)
  @JoinColumn({ name: 'factory_id' })
  factory: FactoryEntity;

  @Column({ type: 'varchar' })
  factoryId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: QrStatus.ACTIVE,
  })
  status: QrStatus;

  @Column({ type: 'varchar', length: 255 })
  payload: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date | null;
}
