import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { PaginationQueryDto } from '../../utils/common/dto';

export class ListEmployeesDto extends PaginationQueryDto {
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
}
