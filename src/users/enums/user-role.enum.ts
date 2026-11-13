export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  HR_STAFF = 'HR_STAFF',
  SECURITY_GUARD = 'SECURITY_GUARD',
  PRODUCTION_SUPERVISOR = 'PRODUCTION_SUPERVISOR',
  EXECUTIVE_MANAGEMENT = 'EXECUTIVE_MANAGEMENT',
  EMPLOYEE = 'EMPLOYEE',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_ADMIN]: [
    'dashboard',
    'employees',
    'qr-codes',
    'my-qr',
    'attendance',
    'gates',
    'reports',
    'audit-logs',
    'settings',
  ],
  [UserRole.HR_STAFF]: [
    'dashboard',
    'employees',
    'qr-codes',
    'my-qr',
    'attendance',
    'reports',
  ],
  [UserRole.SECURITY_GUARD]: ['my-qr', 'attendance', 'gates'],
  [UserRole.PRODUCTION_SUPERVISOR]: ['dashboard', 'my-qr', 'attendance'],
  [UserRole.EXECUTIVE_MANAGEMENT]: ['dashboard', 'my-qr', 'reports'],
  [UserRole.EMPLOYEE]: ['my-qr'],
};
