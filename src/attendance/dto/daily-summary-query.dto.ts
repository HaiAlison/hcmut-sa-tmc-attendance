import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/common/dto';

export class DailySummaryQueryDto extends PaginationQueryDto {
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
}

