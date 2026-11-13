import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GateEntity } from '../entities/gate.entity';
import { AttendanceTransactionEntity } from '../entities/attendance-transaction.entity';
import { GatesController } from './gates.controller';
import { GatesService } from './gates.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GateEntity, AttendanceTransactionEntity]),
    AuthModule,
  ],
  controllers: [GatesController],
  providers: [GatesService],
  exports: [GatesService],
})
export class GatesModule {}

