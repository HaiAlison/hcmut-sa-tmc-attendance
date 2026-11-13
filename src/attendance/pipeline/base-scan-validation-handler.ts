import { IScanValidationHandler } from './scan-validation-handler.interface';
import { ScanContext } from './scan-context.interface';

export abstract class BaseScanValidationHandler
  implements IScanValidationHandler {
  private nextHandler?: IScanValidationHandler;

  setNext(handler: IScanValidationHandler): IScanValidationHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(context: ScanContext): Promise<ScanContext> {
    const updated = await this.validate(context);
    if (!updated.isAllowed) {
      // Access was denied by this handler; halt pipeline execution
      return updated;
    }

    if (this.nextHandler) {
      return this.nextHandler.handle(updated);
    }

    return updated;
  }

  protected abstract validate(context: ScanContext): Promise<ScanContext>;
}

