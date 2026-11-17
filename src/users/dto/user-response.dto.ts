import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { PaginationResponse } from '../../utils/common/interface';

export class UserResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van Admin' })
  name: string;

  @ApiProperty({ example: 'admin@tmc.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SYSTEM_ADMIN })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ example: 'TMC-BD-0001' })
  linkedEmployeeId?: string | null;

  @ApiPropertyOptional()
  lastLogin?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class PaginatedUsersResponseDto
  implements PaginationResponse<UserResponseDto>
{
  @ApiProperty({ type: [UserResponseDto] })
  results: UserResponseDto[];

  @ApiProperty({ example: 10 })
  totalItems: number;

  @ApiProperty({ example: 1 })
  offset: number;

  @ApiProperty({ example: 25 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiPropertyOptional({ type: [UserResponseDto] })
  data?: UserResponseDto[];

  @ApiPropertyOptional({ example: 10 })
  total?: number;

  @ApiPropertyOptional()
  otherParams?: any;
}

