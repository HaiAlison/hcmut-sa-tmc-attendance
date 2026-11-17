import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Name of the department',
    example: 'Advanced Assembly',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Factory ID (UUID or factory code)',
    example: 'BDF',
  })
  @IsOptional()
  @IsString()
  factoryId?: string;
}

