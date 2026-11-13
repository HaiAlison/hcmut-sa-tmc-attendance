import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/enums/user-role.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

export class UserProfileDto {
  @ApiProperty({ example: 'USR-001' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van Admin' })
  name: string;

  @ApiProperty({ example: 'admin@tmc.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SYSTEM_ADMIN })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ example: 'TMC-BD-0001', nullable: true })
  linkedEmployeeId?: string | null;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Access Token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Refresh Token',
  })
  refreshToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

export class UserMeResponseDto extends UserProfileDto {
  @ApiProperty({
    type: [String],
    example: [
      'dashboard',
      'employees',
      'qr-codes',
      'my-qr',
      'attendance',
      'gates',
      'reports',
      'audit-logs',
      'settings',
    ],
  })
  permissions: string[];
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}
