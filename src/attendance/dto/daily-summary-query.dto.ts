import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class DailySummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Target date (YYYY-MM-DD)',
    example: '2026-11-09',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by factory ID (BD, LA, or ALL)',
    example: 'BD',
  })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by department ID (e.g. BD-PROD)',
    example: 'BD-PROD',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page (max 100)',
    default: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Page number alias (offset)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  offset?: number;

  @ApiPropertyOptional({ description: 'Page size alias (limit)', default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

