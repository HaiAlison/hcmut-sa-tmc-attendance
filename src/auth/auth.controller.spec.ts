import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../users/enums/user-role.enum';
import { UserStatus } from '../users/enums/user-status.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockUser = {
    id: 'USR-001',
    name: 'Nguyen Van Admin',
    email: 'admin@tmc.com',
    role: UserRole.SYSTEM_ADMIN,
    status: UserStatus.ACTIVE,
    linkedEmployeeId: 'TMC-BD-0001',
  };

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: mockUser,
    }),
    refreshTokens: jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: mockUser,
    }),
    logout: jest.fn().mockResolvedValue({
      message: 'Logged out successfully',
    }),
    getMe: jest.fn().mockResolvedValue({
      ...mockUser,
      permissions: [
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
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login', () => {
    it('should return tokens and user profile on successful login', async () => {
      const res = mockResponse();
      const result = await controller.login(
        { email: 'admin@tmc.com', password: 'string' },
        res,
      );

      expect(authService.login).toHaveBeenCalledWith({
        email: 'admin@tmc.com',
        password: 'string',
      });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.email).toBe('admin@tmc.com');
      expect(result.user.role).toBe(UserRole.SYSTEM_ADMIN);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens when token provided in body', async () => {
      const res = mockResponse();
      const req: any = { cookies: {} };
      const result = await controller.refresh(
        { refreshToken: 'mock-refresh-token' },
        req,
        res,
      );

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'mock-refresh-token',
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('should refresh tokens when token provided in cookie', async () => {
      const res = mockResponse();
      const req: any = { cookies: { refreshToken: 'cookie-refresh-token' } };
      const result = await controller.refresh({}, req, res);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'cookie-refresh-token',
      );
      expect(result.accessToken).toBe('new-access-token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear refresh token cookie and invalidate session', async () => {
      const res = mockResponse();
      const result = await controller.logout('USR-001', res);

      expect(authService.logout).toHaveBeenCalledWith('USR-001');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
      });
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile and assigned permissions', async () => {
      const result = await controller.getMe('USR-001');

      expect(authService.getMe).toHaveBeenCalledWith('USR-001');
      expect(result.id).toBe('USR-001');
      expect(result.permissions).toContain('dashboard');
      expect(result.permissions).toContain('employees');
    });
  });
});
