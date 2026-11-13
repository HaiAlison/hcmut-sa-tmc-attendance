import { ApiProperty } from '@nestjs/swagger';
import { GateStatus, GateType } from '../../entities/gate.entity';

export class GateResponseDto {
  @ApiProperty({ example: 'GATE-BD-01' })
  id: string;

  @ApiProperty({ example: 'Main Gate 1 (Entry)' })
  name: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  factoryId: string;

  @ApiProperty({ enum: GateType, example: GateType.ENTRY })
  type: GateType;

  @ApiProperty({ enum: GateStatus, example: GateStatus.ONLINE })
  status: GateStatus;

  @ApiProperty({ example: 'West Entrance Turnstile 1' })
  location: string;

  @ApiProperty({ example: '192.168.1.101', nullable: true })
  ipAddress?: string | null;

  @ApiProperty({ example: '00:1A:2B:3C:4D:5E', nullable: true })
  macAddress?: string | null;

  @ApiProperty({ example: 'v2.4.1', nullable: true })
  firmwareVersion?: string | null;

  @ApiProperty({ example: '2026-11-09T07:15:00.000Z', nullable: true })
  lastHeartbeatAt?: Date | null;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-09T07:15:00.000Z' })
  updatedAt: Date;
}

export class GateDailyVolumeDto {
  @ApiProperty({ example: '2026-11-08' })
  date: string;

  @ApiProperty({ example: 450 })
  success: number;

  @ApiProperty({ example: 12 })
  denied: number;
}

export class GateStats7DaysDto {
  @ApiProperty({ example: 3200 })
  totalScans: number;

  @ApiProperty({ example: 3120 })
  successfulScans: number;

  @ApiProperty({ example: 80 })
  deniedScans: number;

  @ApiProperty({ type: [GateDailyVolumeDto] })
  dailyBreakdown: GateDailyVolumeDto[];
}

export class GateDetailResponseDto {
  @ApiProperty({ type: GateResponseDto })
  gate: GateResponseDto;

  @ApiProperty({ type: GateStats7DaysDto })
  stats7Days: GateStats7DaysDto;

  @ApiProperty({ type: [Object], example: [] })
  recentEvents: any[];
}

export class PaginatedGatesResponseDto {
  @ApiProperty({ type: [GateResponseDto] })
  data: GateResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 25 })
  pageSize: number;

  @ApiProperty({ type: [GateResponseDto], required: false })
  results?: GateResponseDto[];

  @ApiProperty({ example: 10, required: false })
  totalItems?: number;

  @ApiProperty({ example: 1, required: false })
  offset?: number;

  @ApiProperty({ example: 25, required: false })
  limit?: number;

  @ApiProperty({ example: 1, required: false })
  totalPages?: number;
}

