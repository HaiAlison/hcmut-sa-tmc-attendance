import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  Unique
} from 'typeorm';
import { AttendanceTransactionEntity } from './attendance-transaction.entity';
import { GateEntity } from './gate.entity';
import { EmployeeEntity } from './employee.entity';
import { DepartmentEntity } from './department.entity';

export type FactoryStatus = 'ACTIVE' | 'INACTIVE';

@Entity('factories')
@Unique(['code'])
export class FactoryEntity extends BaseTimeStampEntity {

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: FactoryStatus;

  @OneToMany(() => GateEntity, (gate) => gate.factory)
  gates: GateEntity[];

  @OneToMany(() => EmployeeEntity, (employee) => employee.factory)
  employees: EmployeeEntity[];

  @OneToMany(() => DepartmentEntity, (department) => department.factory)
  departments: DepartmentEntity[];
}
