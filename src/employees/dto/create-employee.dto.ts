import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';
import { FactoryCode } from '../enums/factory.enum';
import { Gender } from '../enums/gender.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Tran Thi Mai' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'BD-PROD' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ example: 'Assembly Technician' })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  factoryId?: string;

  factoryCode: FactoryCode;

  @ApiProperty({ example: 'mai.tran@tmc.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+84 912 345 678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'hireDate must be in format YYYY-MM-DD',
  })
  hireDate: string;

  @ApiProperty({ example: '1995-04-12' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must be in format YYYY-MM-DD',
  })
  dateOfBirth: string;

  @ApiProperty({ enum: Gender, example: Gender.F })
  @IsEnum(Gender)
  gender: Gender;
}
