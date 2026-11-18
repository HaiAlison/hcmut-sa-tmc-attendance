import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import {
  AttendanceEventType,
  QrValidationStatus,
  ScanTransactionStatus,
} from '../entities/attendance-transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: Partial<Record<keyof AttendanceService, jest.Mock>>;

  const mockTransaction = {
    id: 'TX-034821',
    employeeId: 'TMC-BD-0001',
    employeeName: 'Nguyen Van An',
    factoryId: 'BD',
    gateId: 'GATE-BD-01',
    gateName: 'Main Gate 1 (Entry)',
    eventType: AttendanceEventType.CHECK_IN,
    timestamp: new Date('2026-11-09T07:22:10.000Z'),
    qrValidation: QrValidationStatus.VALID,
    status: ScanTransactionStatus.SUCCESS,
    synced: true,
  };

  beforeEach(async () => {
    service = {
      scan: jest.fn().mockResolvedValue({
        transaction: mockTransaction,
        message: 'Access granted — gate unlocked',
      }),
      listTransactions: jest.fn().mockResolvedValue({
        results: [mockTransaction],
        data: [mockTransaction],
        totalItems: 1,
        total: 1,
        offset: 1,
        limit: 25,
        totalPages: 1,
      }),
      getTransactionById: jest.fn().mockResolvedValue(mockTransaction),
      getDailySummary: jest.fn().mockResolvedValue({
        results: [
          {
            employeeId: 'TMC-BD-0001',
            employeeName: 'Nguyen Van An',
            departmentId: 'BD-PROD',
            departmentName: 'Production',
            factoryId: 'BD',
            date: '2026-11-09',
            firstCheckIn: '07:22:10',
            lastCheckOut: null,
            workedMinutes: 0,
            lateMinutes: 0,
            status: 'PRESENT',
          },
        ],
        data: [
          {
            employeeId: 'TMC-BD-0001',
            employeeName: 'Nguyen Van An',
            departmentId: 'BD-PROD',
            departmentName: 'Production',
            factoryId: 'BD',
            date: '2026-11-09',
            firstCheckIn: '07:22:10',
            lastCheckOut: null,
            workedMinutes: 0,
            lateMinutes: 0,
            status: 'PRESENT',
          },
        ],
        totalItems: 1,
        total: 1,
        offset: 1,
        limit: 25,
        totalPages: 1,
      }),
      getDashboard: jest.fn().mockResolvedValue({
        kpis: {
          totalEmployees: 1259,
          presentToday: 1215,
          insideNow: 1150,
          checkInsToday: 1250,
          checkOutsToday: 1186,
          deniedToday: 14,
          lateToday: 18,
          onLeaveToday: 26,
          absentToday: 18,
          gateTrafficToday: 2450,
          deniedScansToday: 14,
          attendanceRate: 96.5,
        },
        trend: [],
        distribution: [],
        recentEvents: [mockTransaction],
        factoryComparison: [],
        attendanceRate: 96.5,
        factoryBreakdown: [],
        gateDistribution: [],
        recentActivity: [mockTransaction],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttendanceController>(AttendanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /attendance/scan', () => {
    it('should process access scan and return decision', async () => {
      const dto = {
        qrPayload:
          'tmc://v1/bd/token-3fa85f64-5717-4562-b3fc-2c963f66afa6',
        gateId: 'GATE-BD-01',
        eventType: AttendanceEventType.CHECK_IN,
      };

      const result = await controller.scan(dto);
      expect(service.scan).toHaveBeenCalledWith(dto);
      expect(result.transaction.status).toBe(ScanTransactionStatus.SUCCESS);
      expect(result.message).toContain('Access granted');
    });
  });

  describe('GET /attendance/transactions', () => {
    it('should return paginated transactions', async () => {
      const result = await controller.listTransactions({
        offset: 1,
        limit: 25,
      });
      expect(service.listTransactions).toHaveBeenCalledWith({
        offset: 1,
        limit: 25,
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].id).toBe('TX-034821');
    });
  });

  describe('GET /attendance/transactions/:id', () => {
    it('should return single transaction details', async () => {
      const result = await controller.getTransactionById('TX-034821');
      expect(service.getTransactionById).toHaveBeenCalledWith('TX-034821');
      expect(result.id).toBe('TX-034821');
    });
  });

  describe('GET /attendance/daily-summary', () => {
    it('should return aggregated daily employee attendance records', async () => {
      const result = await controller.getDailySummary({
        date: '2026-11-09',
        offset: 1,
        limit: 25,
      });
      expect(service.getDailySummary).toHaveBeenCalledWith({
        date: '2026-11-09',
        offset: 1,
        limit: 25,
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('PRESENT');
    });
  });

  describe('GET /attendance/dashboard', () => {
    it('should return system dashboard overview KPIs', async () => {
      const result = await controller.getDashboard('BD');
      expect(service.getDashboard).toHaveBeenCalledWith('BD');
      expect(result.kpis.totalEmployees).toBe(1259);
      expect(result.kpis.insideNow).toBe(1150);
      expect(result.kpis.checkInsToday).toBe(1250);
      expect(result.kpis.checkOutsToday).toBe(1186);
      expect(result.kpis.deniedToday).toBe(14);
      expect(result.attendanceRate).toBe(96.5);
      expect(result.trend).toEqual([]);
      expect(result.distribution).toEqual([]);
      expect(result.recentEvents).toHaveLength(1);
      expect(result.factoryComparison).toEqual([]);
    });
  });
});

