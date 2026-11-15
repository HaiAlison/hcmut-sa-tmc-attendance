import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUserResponse = {
    id: 'user-uuid-1',
    name: 'Nguyen Van Test',
    email: 'test@tmc.com',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    linkedEmployeeId: 'TMC-BD-0001',
    lastLogin: null,
    createdAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn().mockResolvedValue(mockUserResponse),
    findAll: jest.fn().mockResolvedValue({
      data: [mockUserResponse],
      total: 1,
      page: 1,
      pageSize: 25,
    }),
    getById: jest.fn().mockResolvedValue(mockUserResponse),
    update: jest.fn().mockResolvedValue({ ...mockUserResponse, name: 'Updated' }),
    delete: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto = {
        name: 'Nguyen Van Test',
        email: 'test@tmc.com',
        password: 'Password123',
        role: UserRole.EMPLOYEE,
        status: UserStatus.ACTIVE,
        linkedEmployeeId: 'TMC-BD-0001',
      };

      const result = await controller.create(dto);
      expect(result).toEqual(mockUserResponse);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of users', async () => {
      const query = { page: 1, pageSize: 25 };
      const result = await controller.findAll(query);
      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return user details by id', async () => {
      const result = await controller.findOne('user-uuid-1');
      expect(result).toEqual(mockUserResponse);
      expect(service.getById).toHaveBeenCalledWith('user-uuid-1');
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const dto = { name: 'Updated' };
      const result = await controller.update('user-uuid-1', dto);
      expect(result.name).toBe('Updated');
      expect(service.update).toHaveBeenCalledWith('user-uuid-1', dto);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const result = await controller.delete('user-uuid-1');
      expect(result).toEqual({ message: 'User user-uuid-1 successfully deleted' });
      expect(service.delete).toHaveBeenCalledWith('user-uuid-1');
    });
  });
});
