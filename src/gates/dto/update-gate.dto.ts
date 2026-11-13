import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GateType } from '../../entities/gate.entity';

export class UpdateGateDto {
  @ApiPropertyOptional({ example: 'Main Gate 1 (Entry)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'West Entrance Turnstile 1' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: GateType, example: GateType.ENTRY })
  @IsOptional()
  @IsEnum(GateType)
  type?: GateType;

  @ApiPropertyOptional({ example: '192.168.1.101' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'v2.4.2' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}

