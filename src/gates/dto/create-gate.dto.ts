import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { GateStatus, GateType } from '../../entities/gate.entity';

export class CreateGateDto {
  @ApiPropertyOptional({ example: 'GATE-BD-01' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Main Gate 1 (Entry)' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  factoryId: string;

  @ApiProperty({ enum: GateType, example: GateType.ENTRY })
  @IsNotEmpty()
  @IsEnum(GateType)
  type: GateType;

  @ApiProperty({ example: 'West Entrance Turnstile 1' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiPropertyOptional({ example: '192.168.1.101' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: '00:1A:2B:3C:4D:5E' })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional({ example: 'v2.4.1' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional({ enum: GateStatus, default: GateStatus.ONLINE })
  @IsOptional()
  @IsEnum(GateStatus)
  status?: GateStatus = GateStatus.ONLINE;
}

