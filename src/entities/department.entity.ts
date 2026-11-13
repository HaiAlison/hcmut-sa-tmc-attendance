import { BaseTimeStampEntity } from 'src/utils/config/database/base-entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { FactoryEntity } from './factory.entity';

@Entity('departments')
export class DepartmentEntity extends BaseTimeStampEntity {

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => FactoryEntity, (factory) => factory.departments)
  @JoinColumn({ name: 'factory_id' })
  factory: FactoryEntity;

  @Column({ type: 'varchar' })
  factoryId: string;
}
