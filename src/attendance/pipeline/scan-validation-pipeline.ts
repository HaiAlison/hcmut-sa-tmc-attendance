import { Injectable } from '@nestjs/common';
import { IScanValidationHandler } from './scan-validation-handler.interface';
import { ScanContext } from './scan-context.interface';
import { GateStationValidationHandler } from './handlers/gate-station-validation.handler';
import { QrPayloadValidationHandler } from './handlers/qr-payload-validation.handler';
import { QrStatusValidationHandler } from './handlers/qr-status-validation.handler';
import { EmployeeStatusValidationHandler } from './handlers/employee-status-validation.handler';
import { GateDirectionValidationHandler } from './handlers/gate-direction-validation.handler';

@Injectable()
export class ScanValidationPipeline {
  private readonly headHandler: IScanValidationHandler;

  constructor() {
    // Chain the handlers according to the validation pipeline sequence:
    // 1. Gate station exists & ONLINE
    // 2. QR payload matches valid token in DB
    // 3. QR status is ACTIVE
    // 4. Employee status is ACTIVE or PROBATION
    // 5. Gate directionality check
    const gateHandler = new GateStationValidationHandler();
    const qrPayloadHandler = new QrPayloadValidationHandler();
    const qrStatusHandler = new QrStatusValidationHandler();
    const employeeHandler = new EmployeeStatusValidationHandler();
    const directionHandler = new GateDirectionValidationHandler();

    gateHandler
      .setNext(qrPayloadHandler)
      .setNext(qrStatusHandler)
      .setNext(employeeHandler)
      .setNext(directionHandler);

    this.headHandler = gateHandler;
  }

  async execute(context: ScanContext): Promise<ScanContext> {
    return this.headHandler.handle(context);
  }
}

