import { BaseScanValidationHandler } from '../base-scan-validation-handler';
import { ScanContext } from '../scan-context.interface';
import { DenialReason } from '../../../entities/attendance-transaction.entity';
import { GateStatus } from '../../../entities/gate.entity';

export class GateStationValidationHandler extends BaseScanValidationHandler {
  protected async validate(context: ScanContext): Promise<ScanContext> {
    if (!context.gate) {
      context.isAllowed = false;
      context.denialReason = DenialReason.GATE_OFFLINE;
      context.errorMessage = `Gate station ${context.gateId} not found`;
      return context;
    }

    // If request is not in offline sync mode, the gate controller must be ONLINE
    if (!context.offline && context.gate.status !== GateStatus.ONLINE) {
      context.isAllowed = false;
      context.denialReason = DenialReason.GATE_OFFLINE;
      context.errorMessage = `Gate station ${context.gateId} is ${context.gate.status}`;
      return context;
    }

    return context;
  }
}

