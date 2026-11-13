import { BaseScanValidationHandler } from '../base-scan-validation-handler';
import { ScanContext } from '../scan-context.interface';
import { DenialReason } from '../../../entities/attendance-transaction.entity';
import { EmploymentStatus } from '../../../employees/enums/employment-status.enum';

export class EmployeeStatusValidationHandler extends BaseScanValidationHandler {
  protected async validate(context: ScanContext): Promise<ScanContext> {
    const employee = context.employee;

    if (!employee) {
      context.isAllowed = false;
      context.denialReason = DenialReason.INACTIVE_EMPLOYEE;
      context.errorMessage = 'Employee record not found';
      return context;
    }

    const isAuthorized =
      employee.employmentStatus === EmploymentStatus.ACTIVE ||
      employee.employmentStatus === EmploymentStatus.PROBATION;

    if (!isAuthorized) {
      context.isAllowed = false;
      context.denialReason = DenialReason.INACTIVE_EMPLOYEE;
      context.errorMessage = `Employee status is ${employee.employmentStatus}; access denied`;
      return context;
    }

    return context;
  }
}

