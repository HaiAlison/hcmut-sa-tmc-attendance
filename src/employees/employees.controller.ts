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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmploymentStatusDto } from './dto/update-status.dto';
import {
  EmployeeDetailResponseDto,
  EmployeeResponseDto,
  PaginatedEmployeesResponseDto,
} from './dto/employee-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Employees Management (/employees)')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({
    summary: 'List employees with filters and pagination',
    description:
      'Returns paginated list of employees with active QR code status. Accessible to all authenticated users.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated employee list',
    type: PaginatedEmployeesResponseDto,
  })
  async list(
    @Query() params: ListEmployeesDto,
  ): Promise<PaginatedEmployeesResponseDto> {
    return this.employeesService.list(params);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get employee profile, assigned QR code, 14-day history, and recent scan logs',
    description:
      'Fetches detailed employee profile along with active QR code and history.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee details',
    type: EmployeeDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  async getById(@Param('id') id: string): Promise<EmployeeDetailResponseDto> {
    return this.employeesService.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new employee (auto-generates ID TMC-{factoryId}-{seq})',
    description:
      'Creates new employee in PROBATION status, auto-generates ID, and issues initial active QR code. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Employee created successfully with active QR code',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Employee with email already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires SYSTEM_ADMIN or HR_STAFF role',
  })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiOperation({
    summary: 'Update employee information',
    description:
      'Updates employee demographics, position, and department. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires SYSTEM_ADMIN or HR_STAFF role',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiOperation({
    summary:
      'Update employment status (ACTIVE, PROBATION, ON_LEAVE, SUSPENDED, TERMINATED)',
    description:
      'Updates status and automatically synchronizes QR code state. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employment status updated successfully',
    type: EmployeeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires SYSTEM_ADMIN or HR_STAFF role',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEmploymentStatusDto,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.HR_STAFF)
  @ApiOperation({
    summary: 'Soft delete or terminate employee',
    description:
      'Soft-deletes employee record, sets status to TERMINATED, and revokes QR code. Roles: Admin, HR.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Employee successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Employee not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Requires SYSTEM_ADMIN or HR_STAFF role',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.employeesService.delete(id);
  }
}
