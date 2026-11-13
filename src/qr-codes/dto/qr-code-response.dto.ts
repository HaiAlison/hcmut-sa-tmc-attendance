import { ApiProperty } from '@nestjs/swagger';
import { QrStatus } from '../../employees/enums/qr-status.enum';

export class QrCodeResponseDto {
  @ApiProperty({ example: 'QR-7B8C9D' })
  id: string;

  @ApiProperty({ example: 'TMC-BD-0001' })
  employeeId: string;

  @ApiProperty({ example: 'BD' })
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
}

export class PaginatedQrCodesResponseDto {
  @ApiProperty({ type: [QrCodeResponseDto] })
  data: QrCodeResponseDto[];

  @ApiProperty({ example: 48 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 25 })
  pageSize: number;

  @ApiProperty({ type: [QrCodeResponseDto], required: false })
  results?: QrCodeResponseDto[];

  @ApiProperty({ example: 48, required: false })
  totalItems?: number;

  @ApiProperty({ example: 1, required: false })
  offset?: number;

  @ApiProperty({ example: 25, required: false })
  limit?: number;

  @ApiProperty({ example: 2, required: false })
  totalPages?: number;
}

