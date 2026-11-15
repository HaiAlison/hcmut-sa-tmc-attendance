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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import {
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@ApiTags('Users Management (/users or /system/users)')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SYSTEM_ADMIN)
@Controller(['users', 'system/users'])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new staff / user account (Admin only)',
    description:
      'Creates a new user account with role, status, and optional linked employee ID. Accessible only by SYSTEM_ADMIN.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with email already exists',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied. Requires SYSTEM_ADMIN role',
  })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List users with filters and pagination (Admin only)',
    description:
      'Returns a paginated list of user accounts with optional filtering by search query, role, and status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users returned successfully',
    type: PaginatedUsersResponseDto,
  })
  async findAll(
    @Query() query: ListUsersDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user details by ID (Admin only)',
    description: 'Returns profile details for a specific user ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details returned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user account (Admin only)',
    description:
      'Updates user properties such as role, status, name, linked employee ID, or resets password.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully updated',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user account (Admin only)',
    description: 'Soft deletes a user account by ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: `User ${id} successfully deleted` };
  }
}

