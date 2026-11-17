import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '../../utils/common/interface';

export type DailyAttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_DEPARTURE'
  | 'ON_LEAVE'
  | 'ABSENT';

export class DailySummaryItemDto {
  @ApiProperty({ example: 'TMC-BD-0001' })
  employeeId: string;

  @ApiProperty({ example: 'Nguyen Van An' })
  employeeName: string;

  @ApiProperty({ example: 'BD-PROD' })
  departmentId: string;

  @ApiProperty({ example: 'BD' })
  factoryId: string;

  @ApiProperty({ example: '2026-11-09' })
  date: string;

  @ApiProperty({ example: '07:18:22', nullable: true })
  firstCheckIn: string | null;

  @ApiProperty({ example: '16:32:00', nullable: true })
  lastCheckOut: string | null;

  @ApiProperty({ example: 494 })
  workedMinutes: number;

  @ApiProperty({ example: 0 })
  lateMinutes: number;

  @ApiProperty({ example: 'PRESENT' })
  status: DailyAttendanceStatus;
}

export class PaginatedDailySummaryResponseDto
  implements PaginationResponse<DailySummaryItemDto> {
  @ApiProperty({ type: [DailySummaryItemDto] })
  results: DailySummaryItemDto[];

  @ApiProperty({ example: 1259 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 51 })
  totalPages: number;

  @ApiPropertyOptional({ type: [DailySummaryItemDto] })
  data?: DailySummaryItemDto[];

  @ApiPropertyOptional({ example: 1259 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

