import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../utils/common/dto';

export class ListGatesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword (gate name)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by factory ID',
    example: '68fe55cd-02b0-4b90-9277-d3e52c767738',
  })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by gate type (ENTRY, EXIT, BIDIRECTIONAL, or ALL)',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (ONLINE, OFFLINE, MAINTENANCE, or ALL)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

