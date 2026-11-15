import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { AttendanceService } from './attendance.service';
import { ScanRequestDto } from './dto/scan-request.dto';
import {
  AttendanceTransactionResponseDto,
  PaginatedTransactionsResponseDto,
  ScanResponseDto,
} from './dto/scan-response.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { DailySummaryQueryDto } from './dto/daily-summary-query.dto';
import { PaginatedDailySummaryResponseDto } from './dto/daily-summary-response.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Scan Processing & Transactions')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Core scan engine: validates QR against gate rules, records transaction',
  })
  @ApiResponse({ status: 200, type: ScanResponseDto })
  async scan(@Body() dto: ScanRequestDto): Promise<ScanResponseDto> {
    return this.attendanceService.scan(dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary: 'Query access transaction logs with full filters and pagination',
  })
  @ApiResponse({ status: 200, type: PaginatedTransactionsResponseDto })
  async listTransactions(
    @Query() query: ListTransactionsDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    return this.attendanceService.listTransactions(query);
  }

  @Get('transactions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'Get transaction details by ID' })
  @ApiResponse({ status: 200, type: AttendanceTransactionResponseDto })
  async getTransactionById(
    @Param('id') id: string,
  ): Promise<AttendanceTransactionResponseDto> {
    return this.attendanceService.getTransactionById(id);
  }

  @Get('daily-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.HR_STAFF,
    UserRole.PRODUCTION_SUPERVISOR,
  )
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary:
      'Aggregated employee daily records (worked/late minutes, status)',
  })
  @ApiResponse({ status: 200, type: PaginatedDailySummaryResponseDto })
  async getDailySummary(
    @Query() query: DailySummaryQueryDto,
  ): Promise<PaginatedDailySummaryResponseDto> {
    return this.attendanceService.getDailySummary(query);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.HR_STAFF,
    UserRole.EXECUTIVE_MANAGEMENT,
    UserRole.PRODUCTION_SUPERVISOR,
  )
  @ApiBearerAuth('Authorization')
  @ApiOperation({
    summary:
      'Aggregated dashboard KPIs, trends, donuts & factory comparison',
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard(
    @Query('factoryId') factoryId?: string,
  ): Promise<DashboardResponseDto> {
    return this.attendanceService.getDashboard(factoryId);
  }
}

