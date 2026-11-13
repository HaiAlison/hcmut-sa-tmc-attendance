import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QrStatus } from '../../employees/enums/qr-status.enum';

export class UpdateQrStatusDto {
  @ApiProperty({
    enum: QrStatus,
    example: QrStatus.SUSPENDED,
    description: 'New QR code status (ACTIVE, EXPIRED, REVOKED, SUSPENDED)',
  })
  @IsEnum(QrStatus)
  @IsNotEmpty()
  status: QrStatus;
}

