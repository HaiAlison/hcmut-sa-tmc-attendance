import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ListDepartmentsDto } from './dto/list-departments.dto';
import {
  DepartmentResponseDto,
  PaginatedDepartmentsResponseDto,
} from './dto/department-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Departments Management')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiBearerAuth('Authorization')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new department in a factory' })
  @ApiResponse({ status: 201, type: DepartmentResponseDto })
  async create(
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'List departments with pagination (offset/limit) and filtering',
  })
  @ApiResponse({ status: 200, type: PaginatedDepartmentsResponseDto })
  async list(
    @Query() query: ListDepartmentsDto,
  ): Promise<PaginatedDepartmentsResponseDto> {
    return this.departmentsService.list(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Get department details by ID' })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  async getById(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.departmentsService.getById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Update department properties' })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Soft delete a department' })
  @ApiResponse({ status: 200 })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.departmentsService.delete(id);
  }
}

