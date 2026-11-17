import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Name of the department',
    example: 'Production',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Factory ID (UUID or factory code like BDF, DNF)',
    example: 'BDF',
  })
  @IsString()
  @IsNotEmpty()
  factoryId: string;
}

