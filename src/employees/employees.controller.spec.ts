import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { EmploymentStatus } from './enums/employment-status.enum';
import { Gender } from './enums/gender.enum';
import { QrStatus } from './enums/qr-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FactoryCode } from './enums/factory.enum';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeesService;

  const mockEmployee = {
    id: 'TMC-BD-0001',
    fullName: 'Nguyen Van An',
    departmentId: 'BD-PROD',
    departmentName: 'Production',
    position: 'Senior Assembler',
    factoryCode: FactoryCode.BD,
    email: 'an.nguyen@tmc.com',
    phone: '+84 901 234 567',
    employmentStatus: EmploymentStatus.ACTIVE,
    hireDate: '2023-03-15',
    dateOfBirth: '1992-08-20',
    gender: Gender.M,
    qrStatus: QrStatus.ACTIVE,
  };

  const mockEmployeesService = {
    list: jest.fn().mockResolvedValue({
      data: [mockEmployee],
      total: 1,
      offset: 1,
      limit: 25,
    }),
    getById: jest.fn().mockResolvedValue({
      employee: mockEmployee,
      qrCode: {
        id: 'QR-001',
        employeeId: 'TMC-BD-0001',
        employeeName: 'Nguyen Van An',
        factoryCode: FactoryCode.BD,
        status: QrStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date(),
        payload: 'tmc://v1/bd/token-test',
      },
      attendanceHistory: [],
      recentEvents: [],
    }),
    create: jest.fn().mockResolvedValue({
      ...mockEmployee,
      id: 'TMC-BD-0002',
      employmentStatus: EmploymentStatus.PROBATION,
    }),
    update: jest.fn().mockResolvedValue({
      ...mockEmployee,
      position: 'Lead Assembler',
    }),
    updateStatus: jest.fn().mockResolvedValue({
      ...mockEmployee,
      employmentStatus: EmploymentStatus.SUSPENDED,
      qrStatus: QrStatus.SUSPENDED,
    }),
    delete: jest.fn().mockResolvedValue({
      message: 'Employee deleted successfully',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /employees', () => {
    it('should return paginated employee list', async () => {
      const result = await controller.list({ page: 1, pageSize: 25 });
      expect(service.list).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('TMC-BD-0001');
      expect(result.total).toBe(1);
    });
  });

  describe('GET /employees/:id', () => {
    it('should return detailed employee profile and active QR code', async () => {
      const result = await controller.getById('TMC-BD-0001');
      expect(service.getById).toHaveBeenCalledWith('TMC-BD-0001');
      expect(result.employee.id).toBe('TMC-BD-0001');
      expect(result.qrCode).toBeDefined();
      expect(result.qrCode?.status).toBe(QrStatus.ACTIVE);
    });
  });

  describe('POST /employees', () => {
    it('should create employee in PROBATION status and return it', async () => {
      const dto = {
        fullName: 'Tran Thi Mai',
        departmentId: 'BD-PROD',
        position: 'Assembly Technician',
        factoryCode: FactoryCode.BD,
        email: 'mai.tran@tmc.com',
        phone: '+84 912 345 678',
        hireDate: '2026-11-01',
        dateOfBirth: '1995-04-12',
        gender: Gender.F,
      };

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.employmentStatus).toBe(EmploymentStatus.PROBATION);
    });
  });

  describe('PUT /employees/:id', () => {
    it('should update employee information', async () => {
      const result = await controller.update('TMC-BD-0001', {
        position: 'Lead Assembler',
      });
      expect(service.update).toHaveBeenCalledWith('TMC-BD-0001', {
        position: 'Lead Assembler',
      });
      expect(result.position).toBe('Lead Assembler');
    });
  });

  describe('PATCH /employees/:id/status', () => {
    it('should update employment status', async () => {
      const result = await controller.updateStatus('TMC-BD-0001', {
        employmentStatus: EmploymentStatus.SUSPENDED,
      });
      expect(service.updateStatus).toHaveBeenCalledWith('TMC-BD-0001', {
        employmentStatus: EmploymentStatus.SUSPENDED,
      });
      expect(result.employmentStatus).toBe(EmploymentStatus.SUSPENDED);
    });
  });

  describe('DELETE /employees/:id', () => {
    it('should soft delete employee', async () => {
      const result = await controller.delete('TMC-BD-0001');
      expect(service.delete).toHaveBeenCalledWith('TMC-BD-0001');
      expect(result.message).toBe('Employee deleted successfully');
    });
  });
});
