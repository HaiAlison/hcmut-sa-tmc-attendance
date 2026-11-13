import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { GateEntity } from './gate.entity';
import { FactoryEntity } from './factory.entity';

export enum AttendanceEventType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export enum ScanTransactionStatus {
  SUCCESS = 'SUCCESS',
  DENIED = 'DENIED',
}

export enum DenialReason {
  EXPIRED_QR = 'EXPIRED_QR',
  REVOKED_QR = 'REVOKED_QR',
  UNKNOWN_QR = 'UNKNOWN_QR',
  INACTIVE_EMPLOYEE = 'INACTIVE_EMPLOYEE',
  UNAUTHORIZED_GATE = 'UNAUTHORIZED_GATE',
  SUSPENDED_QR = 'SUSPENDED_QR',
  GATE_OFFLINE = 'GATE_OFFLINE',
}

export enum QrValidationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
  FAILED = 'FAILED',
}

@Entity('attendance_transactions')
export class AttendanceTransactionEntity extends BaseTimeStampEntity {

  @Index()
  @Column({ name: 'employee_id', type: 'varchar', length: 32, nullable: true })
  employeeId?: string | null;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.attendanceTransactions)
  employee?: EmployeeEntity;

  @Column({ name: 'factory_id', type: 'varchar' })
  factoryId: string;

  @ManyToOne(() => FactoryEntity)
  @JoinColumn({ name: 'factory_id' })
  factory: FactoryEntity;


  @Index()
  @Column({ name: 'gate_id', type: 'varchar' })
  gateId: string;

  @ManyToOne(() => GateEntity, (gate) => gate.attendanceTransactions)
  @JoinColumn({ name: 'gate_id' })
  gate: GateEntity;


  @Column({
    name: 'event_type',
    type: 'varchar',
    length: 32,
  })
  eventType: AttendanceEventType;

  @Index()
  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ name: 'qr_payload', type: 'varchar', length: 255, nullable: true })
  qrPayload?: string | null;

  @Column({
    name: 'qr_validation',
    type: 'varchar',
    length: 32,
    default: QrValidationStatus.VALID,
  })
  qrValidation: QrValidationStatus;

  @Index()
  @Column({
    type: 'varchar',
    length: 32,
  })
  status: ScanTransactionStatus;

  @Column({
    name: 'denial_reason',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  denialReason?: DenialReason | null;

  @Column({ name: 'error_message', type: 'varchar', length: 255, nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'boolean', default: true })
  synced: boolean;

  @Index()
  @Column({
    name: 'sync_status',
    type: 'varchar',
    length: 32,
    default: SyncStatus.SYNCED,
  })
  syncStatus: SyncStatus;

  @Column({ type: 'boolean', default: false })
  offline: boolean;
}

