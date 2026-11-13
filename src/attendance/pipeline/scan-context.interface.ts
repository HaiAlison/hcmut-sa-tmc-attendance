import {
  AttendanceEventType,
  DenialReason,
  QrValidationStatus,
} from '../../entities/attendance-transaction.entity';
import { GateEntity } from '../../entities/gate.entity';
import { QrCodeEntity } from '../../entities/qr-code.entity';
import { EmployeeEntity } from '../../entities/employee.entity';

export interface ScanContext {
  // Input parameters
  qrPayload: string;
  gateId: string;
  eventType: AttendanceEventType;
  offline?: boolean;
  timestamp: Date;

  // DB Entities
  gate?: GateEntity | null;
  qrCode?: QrCodeEntity | null;
  employee?: EmployeeEntity | null;

  // Pipeline Decision State
  isAllowed: boolean;
  denialReason?: DenialReason | null;
  errorMessage?: string | null;
  qrValidation: QrValidationStatus;
}

