import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DepartmentEntity } from '../entities/department.entity';
import { FactoryEntity } from '../entities/factory.entity';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ListDepartmentsDto } from './dto/list-departments.dto';
import {
  DepartmentResponseDto,
  PaginatedDepartmentsResponseDto,
} from './dto/department-response.dto';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { pagination } from '../utils/common/handle';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly departmentRepository: Repository<DepartmentEntity>,
    @InjectRepository(FactoryEntity)
    private readonly factoryRepository: Repository<FactoryEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDepartments();
  }

  async seedDepartments(): Promise<void> {
    const defaultFactories = [
      {
        name: 'Binh Duong Factory',
        code: 'BDF',
        address: 'Binh Duong Province',
        status: 'ACTIVE' as const,
      },
      {
        name: 'Dong Nai Factory',
        code: 'DNF',
        address: 'Dong Nai Province',
        status: 'ACTIVE' as const,
      },
    ];

    await this.factoryRepository.upsert(defaultFactories, ['code']);

    const defaultDepartmentNames = [
      'Production',
      'Quality Assurance',
      'Warehouse & Logistics',
      'Maintenance & Engineering',
      'Human Resources',
    ];

    for (const fData of defaultFactories) {
      const factory = await this.factoryRepository.findOne({
        where: { code: fData.code },
      });
      if (!factory) continue;

      for (const deptName of defaultDepartmentNames) {
        const existing = await this.departmentRepository.findOne({
          where: { name: deptName, factoryId: factory.id },
          withDeleted: true,
        });

        if (!existing) {
          const dept = this.departmentRepository.create({
            name: deptName,
            factory,
            factoryId: factory.id,
          });
          await this.departmentRepository.save(dept);
        }
      }
    }

    this.logger.log('Seeded default departments for factories: BDF, DNF');
  }

  private async findFactoryByIdOrCode(
    factoryId: string,
  ): Promise<FactoryEntity> {
    const factory = await this.factoryRepository.findOne({
      where: [{ id: factoryId }, { code: factoryId }],
    });

    if (!factory) {
      throw new NotFoundException(`Factory '${factoryId}' not found`);
    }

    return factory;
  }

  async create(dto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    const factory = await this.findFactoryByIdOrCode(dto.factoryId);

    const existing = await this.departmentRepository.findOne({
      where: {
        name: dto.name.trim(),
        factoryId: factory.id,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Department '${dto.name}' already exists in factory '${factory.name}'`,
      );
    }

    const department = this.departmentRepository.create({
      name: dto.name.trim(),
      factory,
      factoryId: factory.id,
    });

    const saved = await this.departmentRepository.save(department);
    return this.toResponseDto(saved);
  }

  async list(params: ListDepartmentsDto): Promise<PaginatedDepartmentsResponseDto> {
    const offset =
      params.offset && params.offset > 0
        ? Number(params.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      params.limit && params.limit > 0
        ? Number(params.limit)
        : DEFAULT_LIMIT_NUMBER;

    const qb = this.departmentRepository.createQueryBuilder('department');
    qb.leftJoinAndSelect('department.factory', 'factory');
    qb.where('department.deleted_at IS NULL');

    if (params.q) {
      const q = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere('LOWER(department.name) LIKE :q', { q });
    }

    if (params.factoryId && params.factoryId !== 'ALL') {
      qb.andWhere(
        '(department.factoryId = :factoryId OR factory.code = :factoryId OR factory.id = :factoryId)',
        { factoryId: params.factoryId },
      );
    }

    qb.orderBy('department.name', 'ASC');

    const paginated = await pagination<DepartmentEntity>(qb, {
      limit,
      offset,
    });

    const data = paginated.results.map((d) => this.toResponseDto(d));

    return {
      results: data,
      data,
      totalItems: paginated.totalItems,
      total: paginated.totalItems,
      offset: paginated.offset,
      limit: paginated.limit,
      totalPages: paginated.totalPages,
    };
  }

  async getById(id: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['factory'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    return this.toResponseDto(department);
  }

  async update(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['factory'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    let targetFactory = department.factory;
    if (dto.factoryId && dto.factoryId !== department.factoryId) {
      targetFactory = await this.findFactoryByIdOrCode(dto.factoryId);
      department.factory = targetFactory;
      department.factoryId = targetFactory.id;
    }

    if (dto.name && dto.name.trim() !== department.name) {
      const existing = await this.departmentRepository.findOne({
        where: {
          name: dto.name.trim(),
          factoryId: targetFactory.id,
        },
      });

      if (existing && existing.id !== department.id) {
        throw new ConflictException(
          `Department '${dto.name}' already exists in factory '${targetFactory.name}'`,
        );
      }

      department.name = dto.name.trim();
    }

    const saved = await this.departmentRepository.save(department);
    return this.toResponseDto(saved);
  }

  async delete(id: string): Promise<{ message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID '${id}' not found`);
    }

    await this.departmentRepository.softDelete(id);
    return { message: `Department '${id}' successfully deleted` };
  }

  private toResponseDto(entity: DepartmentEntity): DepartmentResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      factoryId: entity.factoryId,
      factoryName: entity.factory?.name,
      factoryCode: entity.factory?.code,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }
}

