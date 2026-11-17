import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { FactoryEntity } from '../entities/factory.entity';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity, FactoryEntity]), JwtModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}

