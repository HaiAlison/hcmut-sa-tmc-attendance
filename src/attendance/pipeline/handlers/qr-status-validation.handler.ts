import { BaseScanValidationHandler } from '../base-scan-validation-handler';
import { ScanContext } from '../scan-context.interface';
import {
  DenialReason,
  QrValidationStatus,
} from '../../../entities/attendance-transaction.entity';
import { QrStatus } from '../../../employees/enums/qr-status.enum';

export class QrStatusValidationHandler extends BaseScanValidationHandler {
  protected async validate(context: ScanContext): Promise<ScanContext> {
    const qr = context.qrCode!;

    if (qr.status === QrStatus.EXPIRED) {
      context.isAllowed = false;
      context.denialReason = DenialReason.EXPIRED_QR;
      context.qrValidation = QrValidationStatus.INVALID;
      context.errorMessage = 'QR code has expired';
      return context;
    }

    if (qr.status === QrStatus.REVOKED) {
      context.isAllowed = false;
      context.denialReason = DenialReason.REVOKED_QR;
      context.qrValidation = QrValidationStatus.INVALID;
      context.errorMessage = 'QR code has been revoked';
      return context;
    }

    if (qr.status === QrStatus.SUSPENDED) {
      context.isAllowed = false;
      context.denialReason = DenialReason.SUSPENDED_QR;
      context.qrValidation = QrValidationStatus.INVALID;
      context.errorMessage = 'QR code is currently suspended';
      return context;
    }

    // Check expiration date
    if (qr.expiresAt && new Date(qr.expiresAt).getTime() < context.timestamp.getTime()) {
      context.isAllowed = false;
      context.denialReason = DenialReason.EXPIRED_QR;
      context.qrValidation = QrValidationStatus.INVALID;
      context.errorMessage = 'QR code has expired';
      return context;
    }

    return context;
  }
}

