import { BaseScanValidationHandler } from '../base-scan-validation-handler';
import { ScanContext } from '../scan-context.interface';
import {
  DenialReason,
  QrValidationStatus,
} from '../../../entities/attendance-transaction.entity';

export class QrPayloadValidationHandler extends BaseScanValidationHandler {
  protected async validate(context: ScanContext): Promise<ScanContext> {
    if (!context.qrCode) {
      context.isAllowed = false;
      context.denialReason = DenialReason.UNKNOWN_QR;
      context.qrValidation = QrValidationStatus.INVALID;
      context.errorMessage = 'QR code not found or unrecognized token';
      return context;
    }

    return context;
  }
}

