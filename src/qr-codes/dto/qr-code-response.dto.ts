import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QrStatus } from '../../employees/enums/qr-status.enum';
import { PaginationResponse } from '../../utils/common/interface';

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

export class PaginatedQrCodesResponseDto
  implements PaginationResponse<QrCodeResponseDto>
{
  @ApiProperty({ type: [QrCodeResponseDto] })
  results: QrCodeResponseDto[];

  @ApiProperty({ example: 48 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;

  @ApiPropertyOptional({ type: [QrCodeResponseDto] })
  data?: QrCodeResponseDto[];

  @ApiPropertyOptional({ example: 48 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

