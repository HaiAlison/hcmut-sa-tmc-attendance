import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttendanceEventType,
  DenialReason,
  QrValidationStatus,
  ScanTransactionStatus,
} from '../../entities/attendance-transaction.entity';

export class AttendanceTransactionResponseDto {
  @ApiProperty({ example: 'TX-034821' })
  id: string;

  @ApiPropertyOptional({ example: 'TMC-BD-0001', nullable: true })
  employeeId?: string | null;

  @ApiPropertyOptional({ example: 'Nguyen Van An', nullable: true })
  employeeName?: string | null;

  @ApiProperty({ example: 'BD' })
  factoryCode: string;

  @ApiProperty({ example: 'GATE-BD-01' })
  gateId: string;

  @ApiProperty({ example: 'Main Gate 1 (Entry)' })
  gateName: string;

  @ApiProperty({ enum: AttendanceEventType, example: AttendanceEventType.CHECK_IN })
  eventType: AttendanceEventType;

  @ApiProperty({ example: '2026-11-09T07:22:10.000Z' })
  timestamp: Date;

  @ApiProperty({ enum: QrValidationStatus, example: QrValidationStatus.VALID })
  qrValidation: QrValidationStatus;

  @ApiProperty({ enum: ScanTransactionStatus, example: ScanTransactionStatus.SUCCESS })
  status: ScanTransactionStatus;

  @ApiPropertyOptional({ enum: DenialReason, nullable: true })
  denialReason?: DenialReason | null;

  @ApiPropertyOptional({ nullable: true })
  errorMessage?: string | null;

  @ApiProperty({ example: true })
  synced: boolean;
}

export class ScanResponseDto {
  @ApiProperty({ type: AttendanceTransactionResponseDto })
  transaction: AttendanceTransactionResponseDto;

  @ApiProperty({ example: 'Access granted — gate unlocked' })
  message: string;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [AttendanceTransactionResponseDto] })
  data: AttendanceTransactionResponseDto[];

  @ApiProperty({ example: 450 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 25 })
  pageSize: number;

  @ApiProperty({ type: [AttendanceTransactionResponseDto], required: false })
  results?: AttendanceTransactionResponseDto[];

  @ApiProperty({ example: 450, required: false })
  totalItems?: number;

  @ApiProperty({ example: 1, required: false })
  offset?: number;

  @ApiProperty({ example: 25, required: false })
  limit?: number;

  @ApiProperty({ example: 18, required: false })
  totalPages?: number;
}

