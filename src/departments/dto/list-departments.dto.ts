import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/common/dto';

export class ListDepartmentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword (department name)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by factory ID (UUID or code like BDF, DNF)',
    example: 'BDF',
  })
  @IsOptional()
  @IsString()
  factoryId?: string;
}

