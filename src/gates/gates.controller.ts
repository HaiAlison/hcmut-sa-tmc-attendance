import {
  Body,
  Controller,
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
import { GatesService } from './gates.service';
import { CreateGateDto } from './dto/create-gate.dto';
import { UpdateGateDto } from './dto/update-gate.dto';
import { UpdateGateStatusDto } from './dto/update-gate-status.dto';
import { ListGatesDto } from './dto/list-gates.dto';
import {
  GateDetailResponseDto,
  GateResponseDto,
  PaginatedGatesResponseDto,
} from './dto/gate-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Gate Station Controller')
@Controller('gates')

export class GatesController {
  constructor(private readonly gatesService: GatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'List all gate stations with live status' })
  @ApiResponse({ status: 200, type: PaginatedGatesResponseDto })
  async list(@Query() query: ListGatesDto): Promise<PaginatedGatesResponseDto> {
    return this.gatesService.list(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Gate detail: specs, 7-day stats, recent 20 events',
  })
  @ApiResponse({ status: 200, type: GateDetailResponseDto })
  async getById(@Param('id') id: string): Promise<GateDetailResponseDto> {
    return this.gatesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Register new gate station' })
  @ApiResponse({ status: 201, type: GateResponseDto })
  async create(@Body() dto: CreateGateDto): Promise<GateResponseDto> {
    return this.gatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Update gate station properties' })
  @ApiResponse({ status: 200, type: GateResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGateDto,
  ): Promise<GateResponseDto> {
    return this.gatesService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SECURITY_GUARD)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Set gate status (ONLINE, OFFLINE, MAINTENANCE)',
  })
  @ApiResponse({ status: 200, type: GateResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateGateStatusDto,
  ): Promise<GateResponseDto> {
    return this.gatesService.updateStatus(id, dto);
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hardware controller ping to maintain online state',
  })
  @ApiResponse({ status: 200, type: GateResponseDto })
  async heartbeat(@Param('id') id: string): Promise<GateResponseDto> {
    return this.gatesService.heartbeat(id);
  }
}

