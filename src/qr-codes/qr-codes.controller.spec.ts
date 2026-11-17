import { Test, TestingModule } from '@nestjs/testing';
import { QrCodesController } from './qr-codes.controller';
import { QrCodesService } from './qr-codes.service';
import { QrStatus } from '../employees/enums/qr-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

describe('QrCodesController', () => {
  let controller: QrCodesController;
  let service: QrCodesService;

  const mockQrCode = {
    id: 'QR-7B8C9D',
    employeeId: 'TMC-BD-0001',
    employeeName: 'Nguyen Van An',
    factoryId: 'BD',
    status: QrStatus.ACTIVE,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 86_400_000),
    lastUsedAt: null,
    payload: 'tmc://v1/bd/token-test',
  };

  const mockQrCodesService = {
    list: jest.fn().mockResolvedValue({
      results: [mockQrCode],
      data: [mockQrCode],
      totalItems: 1,
      total: 1,
      offset: 1,
      limit: 25,
      totalPages: 1,
    }),
    getById: jest.fn().mockResolvedValue(mockQrCode),
    getByEmployeeId: jest.fn().mockResolvedValue(mockQrCode),
    getMyQr: jest.fn().mockResolvedValue(mockQrCode),
    generate: jest.fn().mockResolvedValue(mockQrCode),
    regenerate: jest.fn().mockResolvedValue({
      ...mockQrCode,
      id: 'QR-NEW001',
      payload: 'tmc://v1/bd/token-rotated',
    }),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockQrCode,
      status: QrStatus.SUSPENDED,
    }),
    revoke: jest.fn().mockResolvedValue({
      ...mockQrCode,
      status: QrStatus.REVOKED,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QrCodesController],
      providers: [
        {
          provide: QrCodesService,
          useValue: mockQrCodesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QrCodesController>(QrCodesController);
    service = module.get<QrCodesService>(QrCodesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /qr-codes', () => {
    it('should return paginated QR codes list', async () => {
      const result = await controller.list({ offset: 1, limit: 25 });
      expect(service.list).toHaveBeenCalledWith({ offset: 1, limit: 25 });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe('QR-7B8C9D');
    });
  });

  describe('GET /qr-codes/my-qr', () => {
    it('should return active QR code for logged-in user persona', async () => {
      const result = await controller.getMyQr(
        'USR-001',
        'TMC-BD-0001',
        'an.nguyen@tmc.com',
      );
      expect(service.getMyQr).toHaveBeenCalledWith(
        'USR-001',
        'TMC-BD-0001',
        'an.nguyen@tmc.com',
      );
      expect(result.id).toBe('QR-7B8C9D');
    });
  });

  describe('GET /qr-codes/employee/:employeeId', () => {
    it('should return active QR code for specific employee ID', async () => {
      const result = await controller.getByEmployee('TMC-BD-0001');
      expect(service.getByEmployeeId).toHaveBeenCalledWith('TMC-BD-0001');
      expect(result.employeeId).toBe('TMC-BD-0001');
    });
  });

  describe('GET /qr-codes/:id', () => {
    it('should return QR code by ID', async () => {
      const result = await controller.getById('QR-7B8C9D');
      expect(service.getById).toHaveBeenCalledWith('QR-7B8C9D');
      expect(result.id).toBe('QR-7B8C9D');
    });
  });

  describe('POST /qr-codes/generate', () => {
    it('should generate fresh QR code for employee', async () => {
      const result = await controller.generate({ employeeId: 'TMC-BD-0001' });
      expect(service.generate).toHaveBeenCalledWith({
        employeeId: 'TMC-BD-0001',
      });
      expect(result.status).toBe(QrStatus.ACTIVE);
    });
  });

  describe('POST /qr-codes/:id/regenerate', () => {
    it('should rotate/re-issue QR payload', async () => {
      const result = await controller.regenerate(
        'QR-7B8C9D',
        'USR-001',
        UserRole.EMPLOYEE,
      );
      expect(service.regenerate).toHaveBeenCalledWith(
        'QR-7B8C9D',
        'USR-001',
        UserRole.EMPLOYEE,
      );
      expect(result.id).toBe('QR-NEW001');
    });
  });

  describe('PATCH /qr-codes/:id/status', () => {
    it('should update QR code status', async () => {
      const result = await controller.updateStatus('QR-7B8C9D', {
        status: QrStatus.SUSPENDED,
      });
      expect(service.updateStatus).toHaveBeenCalledWith('QR-7B8C9D', {
        status: QrStatus.SUSPENDED,
      });
      expect(result.status).toBe(QrStatus.SUSPENDED);
    });
  });

  describe('POST /qr-codes/:id/revoke', () => {
    it('should revoke QR code', async () => {
      const result = await controller.revoke('QR-7B8C9D');
      expect(service.revoke).toHaveBeenCalledWith('QR-7B8C9D');
      expect(result.status).toBe(QrStatus.REVOKED);
    });
  });
});

