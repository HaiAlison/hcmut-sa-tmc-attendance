import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LoginResponseDto,
  LogoutResponseDto,
  UserMeResponseDto,
} from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication & Identity (/auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password, returns JWT pair & user profile',
    description:
      'Authenticates user credentials and provides access and refresh tokens. Also sets an HTTP-only refresh token cookie.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or inactive account',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(loginDto);

    // Set refresh token cookie (HTTP-only)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token cookie/body',
    description:
      'Generates a new token pair from an existing refresh token supplied in request body or HTTP cookie.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully refreshed',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid, revoked, or expired refresh token',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const refreshToken =
      refreshTokenDto.refreshToken ||
      req.cookies?.['refreshToken'] ||
      req.cookies?.['refresh_token'];

    if (!refreshToken) {
      throw new BadRequestException(
        'Refresh token must be provided in body or cookie',
      );
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Invalidate current session/token',
    description:
      'Invalidates current refresh token session and clears authentication cookies.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  async logout(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('Unauthenticated user');
    }

    res.clearCookie('refreshToken', { path: '/' });
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Fetch authenticated user profile, assigned role, and permissions',
    description:
      'Returns current authenticated user details along with their module-level permissions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user profile with permissions',
    type: UserMeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Missing or invalid access token',
  })
  async getMe(@CurrentUser('sub') userId: string): Promise<UserMeResponseDto> {
    if (!userId) {
      throw new UnauthorizedException('Unauthenticated user');
    }
    return this.authService.getMe(userId);
  }
}
