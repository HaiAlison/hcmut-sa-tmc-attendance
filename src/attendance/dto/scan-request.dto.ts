import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AttendanceEventType } from '../../entities/attendance-transaction.entity';

export class ScanRequestDto {
  @ApiProperty({
    example: 'tmc://v1/bd/token-3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsNotEmpty()
  @IsString()
  qrPayload: string;

  @ApiProperty({ example: 'GATE-BD-01' })
  @IsNotEmpty()
  @IsString()
  gateId: string;

  @ApiProperty({ enum: AttendanceEventType, example: AttendanceEventType.CHECK_IN })
  @IsNotEmpty()
  @IsEnum(AttendanceEventType)
  eventType: AttendanceEventType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  offline?: boolean = false;
}

