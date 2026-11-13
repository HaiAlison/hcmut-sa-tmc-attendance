import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCodeEntity } from '../entities/qr-code.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { UserEntity } from '../entities/user.entity';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { DefaultQrTokenGenerator } from './generators/default-qr-token-generator.service';
import { QR_TOKEN_GENERATOR } from './interfaces/qr-token-generator.interface';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([QrCodeEntity, EmployeeEntity, UserEntity]),
    AuthModule,
  ],
  controllers: [QrCodesController],
  providers: [
    QrCodesService,
    {
      provide: QR_TOKEN_GENERATOR,
      useClass: DefaultQrTokenGenerator,
    },
  ],
  exports: [QrCodesService, QR_TOKEN_GENERATOR, TypeOrmModule],
})
export class QrCodesModule {}

