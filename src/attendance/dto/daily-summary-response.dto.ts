import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'Production' })
  departmentName: string;

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

export class PaginatedDailySummaryResponseDto {
  @ApiProperty({ type: [DailySummaryItemDto] })
  data: DailySummaryItemDto[];

  @ApiProperty({ example: 1259 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 25 })
  pageSize: number;

  @ApiProperty({ type: [DailySummaryItemDto], required: false })
  results?: DailySummaryItemDto[];

  @ApiProperty({ example: 1259, required: false })
  totalItems?: number;

  @ApiProperty({ example: 1, required: false })
  offset?: number;

  @ApiProperty({ example: 25, required: false })
  limit?: number;

  @ApiProperty({ example: 51, required: false })
  totalPages?: number;
}

