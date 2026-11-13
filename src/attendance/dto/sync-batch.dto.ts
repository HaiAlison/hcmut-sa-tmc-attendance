import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AttendanceEventType } from '../../entities/attendance-transaction.entity';

export class QueuedTransactionItemDto {
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

  @ApiProperty({
    enum: AttendanceEventType,
    example: AttendanceEventType.CHECK_IN,
  })
  @IsNotEmpty()
  @IsEnum(AttendanceEventType)
  eventType: AttendanceEventType;

  @ApiPropertyOptional({ example: '2026-11-09T07:15:00.000Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class SyncBatchDto {
  @ApiProperty({ type: [QueuedTransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueuedTransactionItemDto)
  transactions: QueuedTransactionItemDto[];
}

export class SyncStatsResponseDto {
  @ApiProperty({ example: 0 })
  pending: number;

  @ApiProperty({ example: 450 })
  synced: number;

  @ApiProperty({ example: 0 })
  failed: number;
}

