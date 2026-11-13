import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Gender } from '../enums/gender.enum';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Tran Thi Mai' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'BD-PROD' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Assembly Technician' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ example: 'mai.tran@tmc.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+84 912 345 678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'hireDate must be in format YYYY-MM-DD',
  })
  hireDate?: Date;

  @ApiPropertyOptional({ example: '1995-04-12' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must be in format YYYY-MM-DD',
  })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: Gender, example: Gender.F })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
