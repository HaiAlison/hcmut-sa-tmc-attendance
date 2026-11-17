import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '../../utils/common/interface';

export class DepartmentResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Production' })
  name: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  factoryId: string;

  @ApiPropertyOptional({ example: 'Binh Duong Factory' })
  factoryName?: string;

  @ApiPropertyOptional({ example: 'BDF' })
  factoryCode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}

export class PaginatedDepartmentsResponseDto
  implements PaginationResponse<DepartmentResponseDto>
{
  @ApiProperty({ type: [DepartmentResponseDto] })
  results: DepartmentResponseDto[];

  @ApiProperty({ example: 10 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiPropertyOptional({ type: [DepartmentResponseDto] })
  data?: DepartmentResponseDto[];

  @ApiPropertyOptional({ example: 10 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

