import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceTransactionEntity } from '../entities/attendance-transaction.entity';
import { GateEntity } from '../entities/gate.entity';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { ScanValidationPipeline } from './pipeline/scan-validation-pipeline';
import { AttendanceService } from './attendance.service';
import { AttendanceSyncService } from './attendance-sync.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceSyncController } from './attendance-sync.controller';
import { AuthModule } from '../auth/auth.module';
import { FactoryEntity } from 'src/entities/factory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceTransactionEntity,
      GateEntity,
      QrCodeEntity,
      EmployeeEntity,
      FactoryEntity
    ]),
    AuthModule,
  ],
  controllers: [AttendanceController, AttendanceSyncController],
  providers: [
    ScanValidationPipeline,
    AttendanceService,
    AttendanceSyncService,
  ],
  exports: [AttendanceService, AttendanceSyncService],
})
export class AttendanceModule {}
