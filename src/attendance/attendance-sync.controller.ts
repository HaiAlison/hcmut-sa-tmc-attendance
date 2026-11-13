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
import { AttendanceSyncService } from './attendance-sync.service';
import { SyncBatchDto, SyncStatsResponseDto } from './dto/sync-batch.dto';
import {
  AttendanceTransactionResponseDto,
  PaginatedTransactionsResponseDto,
} from './dto/scan-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Offline Sync Support')
@Controller('attendance/sync')
export class AttendanceSyncController {
  constructor(private readonly syncService: AttendanceSyncService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SECURITY_GUARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch pending offline transactions' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsResponseDto })
  async getPending(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedTransactionsResponseDto> {
    return this.syncService.getPending({ page, pageSize, offset, limit });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return sync status counts ({ pending, synced, failed })',
  })
  @ApiResponse({ status: 200, type: SyncStatsResponseDto })
  async getStats(): Promise<SyncStatsResponseDto> {
    return this.syncService.getStats();
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Bulk upload queued transactions from offline gate buffer',
  })
  @ApiResponse({ status: 200 })
  async batch(@Body() dto: SyncBatchDto) {
    return this.syncService.batch(dto);
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.SECURITY_GUARD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry individual failed/pending sync' })
  @ApiResponse({ status: 200, type: AttendanceTransactionResponseDto })
  async retry(
    @Param('id') id: string,
  ): Promise<AttendanceTransactionResponseDto> {
    return this.syncService.retry(id);
  }

  @Post('all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Batch resolve/sync all pending transactions',
  })
  @ApiResponse({ status: 200 })
  async syncAll() {
    return this.syncService.syncAll();
  }
}
