import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {
  LoginResponseDto,
  LogoutResponseDto,
  UserMeResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { ROLE_PERMISSIONS } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.linkedEmployeeId,
    );

    // Save refresh token hash
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
    await this.usersService.updateLastLogin(user.id);

    const userProfile: UserProfileDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      linkedEmployeeId: user.linkedEmployeeId || null,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async refreshTokens(refreshToken: string): Promise<LoginResponseDto> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'tmc-attendance-super-secret-refresh-key-2026',
    );

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userId = payload.sub;
    const user = await this.usersService.findById(userId, true);
    if (!user || user.status !== UserStatus.ACTIVE || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token or user inactive');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Revoked or invalid refresh token');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.linkedEmployeeId,
    );
    const newRefreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersService.updateRefreshTokenHash(user.id, newRefreshHash);

    const userProfile: UserProfileDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      linkedEmployeeId: user.linkedEmployeeId || null,
    };

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userProfile,
    };
  }

  async logout(userId: string): Promise<LogoutResponseDto> {
    await this.usersService.updateRefreshTokenHash(userId, null);
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string): Promise<UserMeResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    const permissions = ROLE_PERMISSIONS[user.role] || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      linkedEmployeeId: user.linkedEmployeeId || null,
      permissions,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    linkedEmployeeId?: string | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessSecret = this.configService.get<string>(
      'JWT_SECRET',
      'tmc-attendance-super-secret-jwt-key-2026',
    );
    const accessExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '1h',
    );

    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'tmc-attendance-super-secret-refresh-key-2026',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    );

    const accessPayload = {
      sub: userId,
      email,
      role,
      linkedEmployeeId: linkedEmployeeId || null,
    };

    const refreshPayload = {
      sub: userId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
