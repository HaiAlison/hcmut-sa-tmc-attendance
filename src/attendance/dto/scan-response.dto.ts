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

  @ApiPropertyOptional({ example: 'TMC-BD-0001', nullable: true })
  employeeCode?: string | null;

  @ApiProperty({ example: 'BD' })
  factoryCode: string;

  @ApiPropertyOptional()
  factoryName?: string;

  @ApiPropertyOptional({ example: 'TMC-BD-0001', nullable: true })
  departmentId?: string | null;

  @ApiPropertyOptional({ example: 'TMC-BD-0001', nullable: true })
  departmentName?: string | null;

  @ApiProperty({ example: 'GATE-BD-01' })
  gateId: string;

  @ApiProperty({ example: 'Main Gate 1 (Entry)' })
  gateName: string;

  @ApiPropertyOptional({ example: 'BD-001' })
  gateCode?: string;

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

import { PaginationResponse } from '../../utils/common/interface';

export class PaginatedTransactionsResponseDto
  implements PaginationResponse<AttendanceTransactionResponseDto> {
  @ApiProperty({ type: [AttendanceTransactionResponseDto] })
  results: AttendanceTransactionResponseDto[];

  @ApiProperty({ example: 450 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 18 })
  totalPages: number;

  @ApiPropertyOptional({ type: [AttendanceTransactionResponseDto] })
  data?: AttendanceTransactionResponseDto[];

  @ApiPropertyOptional({ example: 450 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

