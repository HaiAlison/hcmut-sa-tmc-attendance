import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FactoryId } from '../../employees/enums/factory.enum';
import { AttendanceTransactionResponseDto } from './scan-response.dto';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  EARLY_DEPARTURE = 'EARLY_DEPARTURE',
  ON_LEAVE = 'ON_LEAVE',
  ABSENT = 'ABSENT',
}

export class DashboardKpisDto {
  @ApiProperty({ example: 1259 })
  totalEmployees: number;

  @ApiProperty({ example: 1215 })
  presentToday: number;

  @ApiProperty({ example: 18 })
  lateToday: number;

  @ApiProperty({ example: 26 })
  onLeaveToday: number;

  @ApiProperty({ example: 18 })
  absentToday: number;

  @ApiProperty({ example: 2450 })
  gateTrafficToday: number;

  @ApiProperty({ example: 14 })
  deniedScansToday: number;

  @ApiPropertyOptional({ example: 96.5 })
  attendanceRate?: number;
}

export type DashboardKpis = DashboardKpisDto;

export class AttendanceTrendItemDto {
  @ApiProperty({ example: '2026-11-09' })
  date: string;

  @ApiProperty({ example: 1215 })
  checkIns: number;

  @ApiProperty({ example: 1180 })
  checkOuts: number;
}

export class AttendanceDistributionItemDto {
  @ApiProperty({ example: 'On Time' })
  name: string;

  @ApiProperty({ example: 1197 })
  value: number;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.PRESENT })
  status: AttendanceStatus;
}

export class FactoryComparisonItemDto {
  @ApiProperty({ enum: FactoryId, example: FactoryId.BD })
  factoryId: FactoryId;

  @ApiProperty({ example: 'Binh Duong Factory' })
  factoryName: string;

  @ApiProperty({ example: 97.1 })
  attendanceRate: number;

  @ApiProperty({ example: 825 })
  checkIns: number;

  @ApiProperty({ example: 5 })
  denied: number;
}

export type AttendanceTransaction = AttendanceTransactionResponseDto;

export class FactoryBreakdownItemDto {
  @ApiProperty({ example: 'uuid' })
  factoryId: string;

  @ApiProperty({ example: 'BD' })
  factoryCode: string;

  @ApiProperty({ example: 'Binh Duong Factory' })
  factoryName: string;

  @ApiProperty({ example: 850 })
  totalEmployees: number;

  @ApiProperty({ example: 825 })
  presentToday: number;

  @ApiProperty({ example: 97.1 })
  attendanceRate: number;
}

export class GateTrafficDistributionDto {
  @ApiProperty({ example: 'GATE-BD-01' })
  gateId: string;

  @ApiProperty({ example: 'Main Gate 1 (Entry)' })
  gateName: string;

  @ApiProperty({ example: 1200 })
  totalScans: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  trend: { date: string; checkIns: number; checkOuts: number }[];
  distribution: { name: string; value: number; status: AttendanceStatus }[];
  recentEvents: AttendanceTransaction[];
  factoryComparison: {
    factoryId: FactoryId;
    factoryName: string;
    attendanceRate: number;
    checkIns: number;
    denied: number;
  }[];
}

export class DashboardResponseDto implements DashboardData {
  @ApiProperty({ type: DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ type: [AttendanceTrendItemDto] })
  trend: AttendanceTrendItemDto[];

  @ApiProperty({ type: [AttendanceDistributionItemDto] })
  distribution: AttendanceDistributionItemDto[];

  @ApiProperty({ type: [AttendanceTransactionResponseDto] })
  recentEvents: AttendanceTransactionResponseDto[];

  @ApiProperty({ type: [FactoryComparisonItemDto] })
  factoryComparison: FactoryComparisonItemDto[];

  @ApiPropertyOptional({ example: 96.5 })
  attendanceRate?: number;

  @ApiPropertyOptional({ type: [FactoryBreakdownItemDto] })
  factoryBreakdown?: FactoryBreakdownItemDto[];

  @ApiPropertyOptional({ type: [GateTrafficDistributionDto] })
  gateDistribution?: GateTrafficDistributionDto[];

  @ApiPropertyOptional({ type: [AttendanceTransactionResponseDto] })
  recentActivity?: AttendanceTransactionResponseDto[];
}
