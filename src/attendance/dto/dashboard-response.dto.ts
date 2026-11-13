import { ApiProperty } from '@nestjs/swagger';

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
}

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

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ example: 96.5 })
  attendanceRate: number;

  @ApiProperty({ type: [FactoryBreakdownItemDto] })
  factoryBreakdown: FactoryBreakdownItemDto[];

  @ApiProperty({ type: [GateTrafficDistributionDto] })
  gateDistribution: GateTrafficDistributionDto[];

  @ApiProperty({ type: [Object], example: [] })
  recentActivity: any[];
}

