import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EmploymentStatus } from '../enums/employment-status.enum';

export class UpdateEmploymentStatusDto {
  @ApiProperty({
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVE,
    description: 'New employment status',
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;
}
