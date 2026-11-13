import { BaseScanValidationHandler } from '../base-scan-validation-handler';
import { ScanContext } from '../scan-context.interface';
import {
  AttendanceEventType,
  DenialReason,
} from '../../../entities/attendance-transaction.entity';
import { GateType } from '../../../entities/gate.entity';

export class GateDirectionValidationHandler extends BaseScanValidationHandler {
  protected async validate(context: ScanContext): Promise<ScanContext> {
    const gate = context.gate!;
    const eventType = context.eventType;

    // CHECK_IN allowed only on ENTRY or BIDIRECTIONAL
    if (eventType === AttendanceEventType.CHECK_IN && gate.type === GateType.EXIT) {
      context.isAllowed = false;
      context.denialReason = DenialReason.UNAUTHORIZED_GATE;
      context.errorMessage =
        'Exit-only gate: check-in is not permitted at this station';
      return context;
    }

    // CHECK_OUT allowed only on EXIT or BIDIRECTIONAL
    if (eventType === AttendanceEventType.CHECK_OUT && gate.type === GateType.ENTRY) {
      context.isAllowed = false;
      context.denialReason = DenialReason.UNAUTHORIZED_GATE;
      context.errorMessage =
        'Entry-only gate: check-out is not permitted at this station';
      return context;
    }

    return context;
  }
}

