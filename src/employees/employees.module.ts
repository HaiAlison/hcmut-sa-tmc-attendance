import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../entities/employee.entity';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { DepartmentEntity } from '../entities/department.entity';
import { FactoryEntity } from '../entities/factory.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity,
      QrCodeEntity,
      DepartmentEntity,
      FactoryEntity,
    ]),
    AuthModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService, TypeOrmModule],
})
export class EmployeesModule {}
