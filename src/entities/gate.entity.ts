import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn
} from 'typeorm';
import { AttendanceTransactionEntity } from './attendance-transaction.entity';
import { FactoryEntity } from './factory.entity';

export enum GateType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export enum GateStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('gates')
export class GateEntity extends BaseTimeStampEntity {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => FactoryEntity, (factory) => factory.gates)
  @JoinColumn({ name: 'factory_id' })
  factory: FactoryEntity;

  @Column({ name: 'factory_id', type: 'varchar' })
  factoryId: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: GateType.BIDIRECTIONAL,
  })
  type: GateType;

  @Column({
    type: 'varchar',
    length: 32,
    default: GateStatus.ONLINE,
  })
  status: GateStatus;

  @Column({ type: 'varchar', length: 150 })
  location: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'mac_address', type: 'varchar', length: 64, nullable: true })
  macAddress?: string | null;

  @Column({
    name: 'firmware_version',
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  firmwareVersion?: string | null;

  @Column({ name: 'last_heartbeat_at', type: 'timestamptz', nullable: true })
  lastHeartbeatAt?: Date | null;

  @OneToMany(() => AttendanceTransactionEntity, (transaction) => transaction.gate)
  attendanceTransactions: AttendanceTransactionEntity[];
}

