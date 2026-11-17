import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AttendanceTransactionEntity,
  SyncStatus,
} from '../entities/attendance-transaction.entity';
import { AttendanceService } from './attendance.service';
import { SyncBatchDto, SyncStatsResponseDto } from './dto/sync-batch.dto';
import {
  AttendanceTransactionResponseDto,
  PaginatedTransactionsResponseDto,
} from './dto/scan-response.dto';
import { pagination } from '../utils/common/handle';
import {
  DEFAULT_LIMIT_NUMBER,
  DEFAULT_PAGE_NUMBER,
} from '../utils/common/constant';
import { PaginationQueryDto } from '../utils/common/dto';

@Injectable()
export class AttendanceSyncService {
  constructor(
    @InjectRepository(AttendanceTransactionEntity)
    private readonly transactionRepository: Repository<AttendanceTransactionEntity>,
    private readonly attendanceService: AttendanceService,
  ) {}

  /**
   * Fetch pending offline transactions using utils pagination
   */
  async getPending(
    options?: PaginationQueryDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    const offset =
      options?.offset && options.offset > 0
        ? Number(options.offset)
        : DEFAULT_PAGE_NUMBER;
    const limit =
      options?.limit && options.limit > 0
        ? Number(options.limit)
        : DEFAULT_LIMIT_NUMBER;

    const qb = this.transactionRepository.createQueryBuilder('tx');
    qb.where('tx.synced = false OR tx.syncStatus = :status', {
      status: SyncStatus.PENDING,
    });
    qb.orderBy('tx.timestamp', 'ASC');

    const paginated = await pagination<AttendanceTransactionEntity>(qb, {
      limit,
      offset,
    });

    const data = paginated.results.map((t) =>
      this.attendanceService.toTransactionDto(t),
    );

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

  /**
   * Return sync statistics { pending, synced, failed }
   */
  async getStats(): Promise<SyncStatsResponseDto> {
    const pending = await this.transactionRepository.count({
      where: [{ synced: false }, { syncStatus: SyncStatus.PENDING }],
    });

    const synced = await this.transactionRepository.count({
      where: { syncStatus: SyncStatus.SYNCED },
    });

    const failed = await this.transactionRepository.count({
      where: { syncStatus: SyncStatus.FAILED },
    });

    return {
      pending,
      synced,
      failed,
    };
  }

  /**
   * Bulk upload queued transactions from offline gate buffer
   */
  async batch(dto: SyncBatchDto): Promise<{
    processed: number;
    succeeded: number;
    denied: number;
    results: AttendanceTransactionResponseDto[];
  }> {
    const results: AttendanceTransactionResponseDto[] = [];
    let succeeded = 0;
    let denied = 0;

    for (const item of dto.transactions) {
      const scanRes = await this.attendanceService.scan({
        qrPayload: item.qrPayload,
        gateId: item.gateId,
        eventType: item.eventType,
        offline: true,
      });

      if (scanRes.transaction.status === 'SUCCESS') {
        succeeded++;
      } else {
        denied++;
      }

      results.push(scanRes.transaction);
    }

    return {
      processed: dto.transactions.length,
      succeeded,
      denied,
      results,
    };
  }

  /**
   * Retry individual failed/pending sync transaction
   */
  async retry(id: string): Promise<AttendanceTransactionResponseDto> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    tx.synced = true;
    tx.syncStatus = SyncStatus.SYNCED;
    const saved = await this.transactionRepository.save(tx);
    return this.attendanceService.toTransactionDto(saved);
  }

  /**
   * Batch resolve/sync all pending transactions
   */
  async syncAll(): Promise<{ syncedCount: number; message: string }> {
    const pendingTransactions = await this.transactionRepository.find({
      where: [{ synced: false }, { syncStatus: SyncStatus.PENDING }],
    });

    for (const tx of pendingTransactions) {
      tx.synced = true;
      tx.syncStatus = SyncStatus.SYNCED;
    }

    if (pendingTransactions.length > 0) {
      await this.transactionRepository.save(pendingTransactions);
    }

    return {
      syncedCount: pendingTransactions.length,
      message: `Successfully synced ${pendingTransactions.length} pending offline transactions`,
    };
  }
}

