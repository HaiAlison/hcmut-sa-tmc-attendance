import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EmploymentStatus } from '../enums/employment-status.enum';

export class ListEmployeesDto {
  @ApiPropertyOptional({ description: 'Search keyword (name or employee ID)' })
  @IsOptional()
  @IsString()
  q?: string;

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

  @ApiPropertyOptional({
    description: 'Filter by employment status or ALL',
    enum: [...Object.values(EmploymentStatus), 'ALL'],
  })
  @IsOptional()
  @IsString()
  employmentStatus?: string;

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
