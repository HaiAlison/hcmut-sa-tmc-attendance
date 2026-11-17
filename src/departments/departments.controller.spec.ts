import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: DepartmentsService;

  const mockDepartment = {
    id: 'dept-uuid-1',
    name: 'Production',
    factoryId: 'factory-uuid-1',
    factoryName: 'Binh Duong Factory',
    factoryCode: 'BDF',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDepartmentsService = {
    create: jest.fn().mockResolvedValue(mockDepartment),
    list: jest.fn().mockResolvedValue({
      results: [mockDepartment],
      data: [mockDepartment],
      totalItems: 1,
      total: 1,
      offset: 1,
      limit: 25,
      totalPages: 1,
    }),
    getById: jest.fn().mockResolvedValue(mockDepartment),
    update: jest.fn().mockResolvedValue({
      ...mockDepartment,
      name: 'Advanced Production',
    }),
    delete: jest.fn().mockResolvedValue({
      message: "Department 'dept-uuid-1' successfully deleted",
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /departments', () => {
    it('should create a department', async () => {
      const dto = { name: 'Production', factoryId: 'BDF' };
      const result = await controller.create(dto);
      expect(result).toEqual(mockDepartment);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /departments', () => {
    it('should return paginated departments list', async () => {
      const query = { offset: 1, limit: 25, factoryId: 'BDF' };
      const result = await controller.list(query);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Production');
      expect(service.list).toHaveBeenCalledWith(query);
    });
  });

  describe('GET /departments/:id', () => {
    it('should return department by id', async () => {
      const result = await controller.getById('dept-uuid-1');
      expect(result).toEqual(mockDepartment);
      expect(service.getById).toHaveBeenCalledWith('dept-uuid-1');
    });
  });

  describe('PATCH /departments/:id', () => {
    it('should update department', async () => {
      const dto = { name: 'Advanced Production' };
      const result = await controller.update('dept-uuid-1', dto);
      expect(result.name).toBe('Advanced Production');
      expect(service.update).toHaveBeenCalledWith('dept-uuid-1', dto);
    });
  });

  describe('DELETE /departments/:id', () => {
    it('should delete department', async () => {
      const result = await controller.delete('dept-uuid-1');
      expect(result).toEqual({
        message: "Department 'dept-uuid-1' successfully deleted",
      });
      expect(service.delete).toHaveBeenCalledWith('dept-uuid-1');
    });
  });
});

