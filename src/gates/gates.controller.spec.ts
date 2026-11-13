import { Test, TestingModule } from '@nestjs/testing';
import { GatesController } from './gates.controller';
import { GatesService } from './gates.service';
import { GateStatus, GateType } from '../entities/gate.entity';
import { FactoryId } from '../employees/enums/factory.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('GatesController', () => {
  let controller: GatesController;
  let service: Partial<Record<keyof GatesService, jest.Mock>>;

  const mockGate = {
    id: 'GATE-BD-01',
    name: 'Main Gate 1 (Entry)',
    factoryId: FactoryId.BD,
    type: GateType.ENTRY,
    status: GateStatus.ONLINE,
    location: 'West Entrance Turnstile 1',
    ipAddress: '192.168.1.101',
    macAddress: '00:1A:2B:3C:4D:01',
    firmwareVersion: 'v2.4.1',
    lastHeartbeatAt: new Date('2026-11-09T07:15:00.000Z'),
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-09T07:15:00.000Z'),
  };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue({
        data: [mockGate],
        total: 1,
        page: 1,
        pageSize: 25,
      }),
      getById: jest.fn().mockResolvedValue({
        gate: mockGate,
        stats7Days: {
          totalScans: 100,
          successfulScans: 95,
          deniedScans: 5,
          dailyBreakdown: [],
        },
        recentEvents: [],
      }),
      create: jest.fn().mockResolvedValue(mockGate),
      update: jest.fn().mockResolvedValue({
        ...mockGate,
        name: 'Updated Gate',
      }),
      updateStatus: jest.fn().mockResolvedValue({
        ...mockGate,
        status: GateStatus.MAINTENANCE,
      }),
      heartbeat: jest.fn().mockResolvedValue(mockGate),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatesController],
      providers: [
        {
          provide: GatesService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GatesController>(GatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /gates', () => {
    it('should return paginated gates list', async () => {
      const result = await controller.list({ page: 1, pageSize: 25 });
      expect(service.list).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('GATE-BD-01');
    });
  });

  describe('GET /gates/:id', () => {
    it('should return gate detail with 7-day stats and events', async () => {
      const result = await controller.getById('GATE-BD-01');
      expect(service.getById).toHaveBeenCalledWith('GATE-BD-01');
      expect(result.gate.id).toBe('GATE-BD-01');
      expect(result.stats7Days.totalScans).toBe(100);
    });
  });

  describe('POST /gates', () => {
    it('should register a new gate station', async () => {
      const dto = {
        name: 'Main Gate 1 (Entry)',
        factoryId: FactoryId.BD,
        type: GateType.ENTRY,
        location: 'West Entrance Turnstile 1',
      };
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('GATE-BD-01');
    });
  });

  describe('PATCH /gates/:id', () => {
    it('should update gate properties', async () => {
      const result = await controller.update('GATE-BD-01', {
        name: 'Updated Gate',
      });
      expect(service.update).toHaveBeenCalledWith('GATE-BD-01', {
        name: 'Updated Gate',
      });
      expect(result.name).toBe('Updated Gate');
    });
  });

  describe('PATCH /gates/:id/status', () => {
    it('should update gate operational status', async () => {
      const result = await controller.updateStatus('GATE-BD-01', {
        status: GateStatus.MAINTENANCE,
      });
      expect(service.updateStatus).toHaveBeenCalledWith('GATE-BD-01', {
        status: GateStatus.MAINTENANCE,
      });
      expect(result.status).toBe(GateStatus.MAINTENANCE);
    });
  });

  describe('POST /gates/:id/heartbeat', () => {
    it('should process heartbeat keep-alive ping', async () => {
      const result = await controller.heartbeat('GATE-BD-01');
      expect(service.heartbeat).toHaveBeenCalledWith('GATE-BD-01');
      expect(result.status).toBe(GateStatus.ONLINE);
    });
  });
});

