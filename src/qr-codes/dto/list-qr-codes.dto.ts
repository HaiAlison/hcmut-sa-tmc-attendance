import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QrStatus } from '../../employees/enums/qr-status.enum';
import { PaginationQueryDto } from '../../utils/common/dto';

export class ListQrCodesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search keyword (employeeId, employeeName, or QR id)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by factory ID (BD, LA, or ALL)',
    example: 'BD',
  })
  @IsOptional()
  @IsString()
  factoryId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by QR status (ACTIVE, EXPIRED, REVOKED, SUSPENDED, or ALL)',
    enum: [...Object.values(QrStatus), 'ALL'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
