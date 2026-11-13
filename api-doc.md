# TMC Attendance & Access Control System - REST API Specification

**Version:** 1.0.0  
**Generated:** 2026-11-09  
**Status:** Ready for Backend Implementation  

---

## Global Conventions

- **Base URL:** `/api/v1`
- **Authentication:** `Authorization: Bearer <JWT_ACCESS_TOKEN>` on all protected endpoints.
- **Timezone & Timestamps:** ISO-8601 strings in UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`), formatted for frontend in `Asia/Ho_Chi_Minh` (UTC+7).
- **Pagination:** Query params `page` (default `1`, 1-based) and `pageSize` (default `25`, max `100`). Response envelope: `{ data: [...], total, page, pageSize }`.
- **Standard Error Envelope:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Reason description or validation failure",
  "timestamp": "2026-11-09T09:26:00.000Z"
}
```

---

## 1. Authentication & Identity (`/auth`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate with email and password, returns JWT token pair & user profile | Public |
| `POST` | `/auth/refresh` | Refresh access token using refresh token cookie or body | Public |
| `POST` | `/auth/logout` | Invalidate current session/refresh token | Authenticated |
| `GET` | `/auth/me` | Fetch authenticated user profile, assigned role, and permissions | Authenticated |

### `POST /auth/login`
- **Request Body:**
```json
{
  "email": "admin@tmc.com",
  "password": "string"
}
```
- **Response `200`:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "USR-001",
    "name": "Nguyen Van Admin",
    "email": "admin@tmc.com",
    "role": "SYSTEM_ADMIN",
    "status": "ACTIVE",
    "linkedEmployeeId": "TMC-BD-0001"
  }
}
```

---

## 2. Employees Management (`/employees`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/employees` | List employees with filters and pagination | All (HR, Admin, Supervisor) |
| `GET` | `/employees/:id` | Get employee profile, assigned QR code, 14-day history, and recent scan logs | All |
| `POST` | `/employees` | Create new employee (auto-generates ID `TMC-{factoryId}-{seq}`) | Admin, HR |
| `PUT` | `/employees/:id` | Update employee information | Admin, HR |
| `PATCH` | `/employees/:id/status` | Update employment status (`ACTIVE`, `PROBATION`, `ON_LEAVE`, `SUSPENDED`, `TERMINATED`) | Admin, HR |
| `DELETE` | `/employees/:id` | Soft delete or terminate employee | Admin, HR |

### `GET /employees`
- **Query Parameters:**
  - `q`: Search keyword (name or employee ID)
  - `factoryId`: `BD` \| `LA` \| `ALL`
  - `departmentId`: e.g. `BD-PROD`
  - `employmentStatus`: `ACTIVE` \| `PROBATION` \| `ON_LEAVE` \| `SUSPENDED` \| `TERMINATED` \| `ALL`
  - `page`: default `1`
  - `pageSize`: default `25`
- **Response `200`:**
```json
{
  "data": [
    {
      "id": "TMC-BD-0001",
      "fullName": "Nguyen Van An",
      "departmentId": "BD-PROD",
      "departmentName": "Production",
      "position": "Senior Assembler",
      "factoryId": "BD",
      "email": "an.nguyen@tmc.com",
      "phone": "+84 901 234 567",
      "employmentStatus": "ACTIVE",
      "hireDate": "2023-03-15",
      "dateOfBirth": "1992-08-20",
      "gender": "M",
      "qrStatus": "ACTIVE"
    }
  ],
  "total": 1259,
  "page": 1,
  "pageSize": 25
}
```

### `POST /employees`
- **Request Body:**
```json
{
  "fullName": "Tran Thi Mai",
  "departmentId": "BD-PROD",
  "position": "Assembly Technician",
  "factoryId": "BD",
  "email": "mai.tran@tmc.com",
  "phone": "+84 912 345 678",
  "hireDate": "2026-11-01",
  "dateOfBirth": "1995-04-12",
  "gender": "F"
}
```
- **Response `201`:** Employee object with generated `id` (e.g. `TMC-BD-0482`), `employmentStatus: "PROBATION"`, and initial active QR code generated.

---

## 3. QR Codes Management (`/qr-codes`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/qr-codes` | List issued QR codes with filtering | Admin, HR, Security |
| `GET` | `/qr-codes/:id` | Get QR code details | Admin, HR |
| `GET` | `/qr-codes/employee/:employeeId` | Get currently active QR for an employee | Admin, HR, Employee |
| `GET` | `/qr-codes/my-qr` | Self-service endpoint for the logged-in employee's badge | Employee |
| `POST` | `/qr-codes/generate` | Generate fresh QR for employee (auto-revokes previous active code) | Admin, HR |
| `POST` | `/qr-codes/:id/regenerate` | Rotate/re-issue QR payload | Admin, HR, Employee |
| `PATCH` | `/qr-codes/:id/status` | Update QR status (`ACTIVE`, `EXPIRED`, `REVOKED`, `SUSPENDED`) | Admin, HR, Security |
| `POST` | `/qr-codes/:id/revoke` | Revoke a compromised or lost QR code | Admin, HR, Security |

### `POST /qr-codes/generate`
- **Request Body:**
```json
{
  "employeeId": "TMC-BD-0001"
}
```
- **Response `201`:**
```json
{
  "id": "QR-7B8C9D",
  "employeeId": "TMC-BD-0001",
  "employeeName": "Nguyen Van An",
  "factoryId": "BD",
  "status": "ACTIVE",
  "createdAt": "2026-11-09T07:15:00.000Z",
  "expiresAt": "2027-11-09T07:15:00.000Z",
  "lastUsedAt": null,
  "payload": "tmc://v1/bd/token-3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

## 4. Gate Station Controller & Access Engine (`/gates` & `/attendance`)

### A. Gate Station Management (`/gates`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/gates` | List all gate stations with live status | All |
| `GET` | `/gates/:id` | Gate detail: specs, 7-day volume/denial stats, recent 20 events | All |
| `POST` | `/gates` | Register new gate station | Admin |
| `PATCH` | `/gates/:id` | Update gate station properties (name, location, type) | Admin |
| `PATCH` | `/gates/:id/status` | Set status (`ONLINE`, `OFFLINE`, `MAINTENANCE`) | Admin, Security |
| `POST` | `/gates/:id/heartbeat` | Hardware controller ping to maintain online state | Hardware / Gateway |

### B. Scan Processing & Transactions (`/attendance`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/attendance/scan` | **Core scan engine**: validates QR against gate rules, records transaction | Hardware / Gate / Simulator |
| `GET` | `/attendance/transactions` | Query access transaction logs with full filters | All |
| `GET` | `/attendance/transactions/:id` | Get transaction details | All |
| `GET` | `/attendance/daily-summary` | Aggregated employee daily records (worked/late minutes, status) | HR, Admin, Supervisor |
| `GET` | `/attendance/dashboard` | Aggregated dashboard KPIs, trends, donuts & factory comparison | Management, HR, Admin |

#### `POST /attendance/scan` (Gate Access Engine)

**Validation Pipeline Sequence:**
1. Gate station exists and `controllerStatus === "ONLINE"`.
2. QR payload matches valid token and is found in DB.
3. QR status is `ACTIVE` (denied if `EXPIRED`, `REVOKED`, `SUSPENDED`).
4. Employee status is `ACTIVE` or `PROBATION` (denied if `ON_LEAVE`, `TERMINATED`, `SUSPENDED`).
5. Gate directionality check:
   - `CHECK_IN` allowed only on `ENTRY` or `BIDIRECTIONAL`.
   - `CHECK_OUT` allowed only on `EXIT` or `BIDIRECTIONAL`.

- **Request Body:**
```json
{
  "qrPayload": "tmc://v1/bd/token-3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "gateId": "GATE-BD-01",
  "eventType": "CHECK_IN",
  "offline": false
}
```

- **Response `200` (Access Granted):**
```json
{
  "transaction": {
    "id": "TX-034821",
    "employeeId": "TMC-BD-0001",
    "employeeName": "Nguyen Van An",
    "factoryId": "BD",
    "gateId": "GATE-BD-01",
    "gateName": "Main Gate 1 (Entry)",
    "eventType": "CHECK_IN",
    "timestamp": "2026-11-09T07:22:10.000Z",
    "qrValidation": "VALID",
    "status": "SUCCESS",
    "synced": true
  },
  "message": "Access granted — gate unlocked"
}
```

- **Response `200` (Access Denied):**
```json
{
  "transaction": {
    "id": "TX-034822",
    "employeeId": "TMC-BD-0001",
    "employeeName": "Nguyen Van An",
    "factoryId": "BD",
    "gateId": "GATE-BD-02",
    "gateName": "Turnstile Exit A",
    "eventType": "CHECK_IN",
    "timestamp": "2026-11-09T07:23:00.000Z",
    "qrValidation": "VALID",
    "status": "DENIED",
    "denialReason": "UNAUTHORIZED_GATE",
    "errorMessage": "Exit-only gate: check-in is not permitted at this station",
    "synced": true
  },
  "message": "Exit-only gate: check-in is not permitted at this station"
}
```

*Denial reasons:* `EXPIRED_QR`, `REVOKED_QR`, `UNKNOWN_QR`, `INACTIVE_EMPLOYEE`, `UNAUTHORIZED_GATE`, `SUSPENDED_QR`.

### C. Offline Sync Support (`/attendance/sync`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/attendance/sync/pending` | Fetch pending offline transactions | Security, Admin |
| `GET` | `/attendance/sync/stats` | Return `{ pending, synced, failed }` count | All |
| `POST` | `/attendance/sync/batch` | Bulk upload queued transactions from offline gate buffer | Gate Hardware / Controller |
| `POST` | `/attendance/sync/:id/retry` | Retry individual failed/pending sync | Security, Admin |
| `POST` | `/attendance/sync/all` | Batch resolve/sync all pending transactions | Admin |

---

## 5. Reports & Payroll Integration (`/reports`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/reports/monthly` | Query monthly attendance summary by employee (`month=YYYY-MM`, `factoryId`, `departmentId`) | HR, Admin, Management |
| `GET` | `/reports/factory` | Monthly factory overview (attendance rates, depts, 14-day trend) | HR, Admin, Management |
| `GET` | `/reports/access-control` | Access control report per gate (total, successful, denied) | Security, Admin |
| `GET` | `/reports/payroll/history` | List previous monthly payroll push export jobs | HR, Admin |
| `POST` | `/reports/payroll/export` | Trigger push of monthly attendance to HR/Payroll system | HR, Admin |

### `POST /reports/payroll/export`
- **Request Body:**
```json
{
  "period": "2026-10",
  "exportedBy": "Nguyen Van Admin"
}
```
- **Response `201`:**
```json
{
  "id": "EXP-0044",
  "period": "2026-10",
  "status": "COMPLETED",
  "exportedAt": "2026-11-09T07:30:00.000Z",
  "records": 1259,
  "exportedBy": "Nguyen Van Admin"
}
```

---

## 6. System Configuration & Organization (`/system`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/system/config` | Get system shifts, QR validity rules, export deadlines | Admin |
| `PUT` | `/system/config` | Update system configuration | Admin |
| `GET` | `/system/users` | List system administration & staff accounts | Admin |
| `POST` | `/system/users` | Create staff account with role | Admin |
| `PATCH` | `/system/users/:id` | Update user status or assign new role | Admin |
| `GET` | `/system/roles` | List available roles and route permission matrix | All |
| `GET` | `/system/factories` | List factories (`BD`, `LA`) | All |
| `PATCH` | `/system/factories/:id` | Update factory name/address/status | Admin |
| `GET` | `/system/departments` | List departments (`factoryId` query optional) | All |
| `POST` | `/system/departments` | Create department under a factory | Admin |
| `DELETE` | `/system/departments/:id` | Delete department | Admin |

### `GET /system/config` / `PUT /system/config`
```json
{
  "timezone": "Asia/Ho_Chi_Minh",
  "shiftStart": "07:30",
  "lateThresholdMinutes": 15,
  "employeeQrValidityDays": 365,
  "dynamicQrTtlSeconds": 60,
  "monthlyExportDay": 25,
  "monthlyExportDeadline": "17:00",
  "workingDaysPerWeek": 6
}
```

---

## 7. Audit Logging (`/audit-logs`)

| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/audit-logs` | Filterable list of security and system operation audit logs | Admin, Security |
| `GET` | `/audit-logs/:id` | Detailed view of single audit record | Admin |

- **Query Parameters:**
  - `q`: Search keyword
  - `from`: ISO date/time string
  - `to`: ISO date/time string
  - `user`: Operator ID or name
  - `module`: `EMPLOYEES` \| `QR_CODES` \| `ATTENDANCE` \| `GATES` \| `REPORTS` \| `SETTINGS` \| `AUTH`
  - `action`: `CREATE` \| `UPDATE` \| `DELETE` \| `LOGIN` \| `LOGOUT` \| `EXPORT` \| `GENERATE` \| `REVOKE` \| `CONFIG_CHANGE`
  - `page`: default `1`
  - `pageSize`: default `25`

---

## 8. Real-time Events (WebSocket / SSE)

- `events:scan`: Emitted on every gate scan event for live counters and gate detail streams.
- `gate:heartbeat`: Live connectivity indicator for gate controller turnstiles.
- `gate:offline-sync`: Status notifications when queued transactions are synced to the central database.
EOF