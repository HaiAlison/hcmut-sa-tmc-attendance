import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { Gender } from '../enums/gender.enum';
import { QrStatus } from '../enums/qr-status.enum';
import { FactoryCode } from '../enums/factory.enum';
import { PaginationResponse } from '../../utils/common/interface';

export class EmployeeResponseDto {
  @ApiProperty({ example: 'TMC-BD-0001' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van An' })
  fullName: string;

  @ApiProperty({ example: 'TMC-BDF-0001' })
  code: string;

  @ApiProperty({ example: 'BD-PROD' })
  departmentId: string;

  @ApiProperty({ example: 'Senior Assembler' })
  position: string;

  @ApiProperty({ example: FactoryCode.BD })
  factoryCode: string;

  @ApiProperty({ example: 'an.nguyen@tmc.com' })
  email: string;

  @ApiProperty({ example: '+84 901 234 567' })
  phone: string;

  @ApiProperty({ enum: EmploymentStatus, example: EmploymentStatus.ACTIVE })
  employmentStatus: EmploymentStatus;

  @ApiProperty({ example: '2023-03-15' })
  hireDate: Date;

  @ApiProperty({ example: '1992-08-20' })
  dateOfBirth: Date;

  @ApiProperty({ enum: Gender, example: Gender.M })
  gender: Gender;

  @ApiProperty({
    enum: QrStatus,
    example: QrStatus.ACTIVE,
    nullable: true,
  })
  qrStatus: QrStatus | null;
}

export class PaginatedEmployeesResponseDto
  implements PaginationResponse<EmployeeResponseDto> {
  @ApiProperty({ type: [EmployeeResponseDto] })
  results: EmployeeResponseDto[];

  @ApiProperty({ example: 1259 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 51 })
  totalPages: number;

  @ApiPropertyOptional({ type: [EmployeeResponseDto] })
  data?: EmployeeResponseDto[];

  @ApiPropertyOptional({ example: 1259 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

export class QrCodeResponseDto {
  @ApiProperty({ example: 'QR-7B8C9D' })
  id: string;

  @ApiProperty({ example: 'TMC-BD-0001' })
  employeeId: string;

  @ApiProperty({ example: FactoryCode.BD })
  factoryCode: string;

  @ApiProperty({ enum: QrStatus, example: QrStatus.ACTIVE })
  status: QrStatus;

  @ApiProperty({ example: '2026-11-09T07:15:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2027-11-09T07:15:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: null, nullable: true })
  lastUsedAt?: Date | null;

  @ApiProperty({
    example: 'tmc://v1/bd/token-3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  payload: string;

  @ApiProperty({ example: 'uuid' })
  factoryId: string;
}

export class EmployeeDetailResponseDto {
  @ApiProperty({ type: EmployeeResponseDto })
  employee: EmployeeResponseDto;

  @ApiProperty({ type: QrCodeResponseDto, nullable: true })
  qrCode: QrCodeResponseDto | null;

  @ApiProperty({ type: [Object], example: [] })
  attendanceHistory: any[];

  @ApiProperty({ type: [Object], example: [] })
  recentEvents: any[];
}
