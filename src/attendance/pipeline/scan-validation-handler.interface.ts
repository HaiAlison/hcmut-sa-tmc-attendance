import { ScanContext } from './scan-context.interface';

export interface IScanValidationHandler {
  setNext(handler: IScanValidationHandler): IScanValidationHandler;
  handle(context: ScanContext): Promise<ScanContext>;
}

