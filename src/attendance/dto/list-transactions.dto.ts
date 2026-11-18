import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/common/dto';

export class ListTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword (employeeId, employeeName, or TX id)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by gate ID' })
  @IsOptional()
  @IsString()
  gateId?: string;

  @ApiPropertyOptional({ description: 'Filter by factory ID (BD, LA, or ALL)' })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by event type (CHECK_IN, CHECK_OUT, or ALL)',
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (SUCCESS, DENIED, or ALL)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter from ISO timestamp' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Filter to ISO timestamp' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

