import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/utils/filters/http-exception.filter';

describe('Scan Processing & Attendance Transactions (/attendance) (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let employeeToken: string;
  let supervisorToken: string;
  let validQrPayload: string;
  let createdTxId: string;
  let adminId: string;
  let supervisorId: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.init();

    // Login as Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@tmc.com', password: process.env.ADMIN_PASSWORD })
      .expect(200);
    adminToken = adminRes.body.accessToken;
    adminId = adminRes.body.user.id;
    // Login as Employee
    const empRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'giang.do@tmc.com.vn', password: 'admin123' })
      .expect(200);
    employeeToken = empRes.body.accessToken;

    // Login as Supervisor
    const supRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dao.pham@tmc.com.vn', password: 'admin123' })
      .expect(200);
    supervisorToken = supRes.body.accessToken;
    // Ensure active QR code exists for TMC-BD-0001
    supervisorId = supRes.body.user.id;
    await request(app.getHttpServer())
      .post('/api/v1/qr-codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: supervisorId });

    // Fetch valid QR payload for TMC-BD-0001
    const qrRes = await request(app.getHttpServer())
      .get(`/api/v1/qr-codes/employee/${supRes.body.user.linkedEmployeeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    validQrPayload = qrRes.body.payload;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /attendance/scan (Gate Access Engine)', () => {
    it('grants access for valid QR at ENTRY gate (CHECK_IN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: validQrPayload,
          gateId: 'GATE-BD-01',
          eventType: 'CHECK_IN',
          offline: false,
        })
        .expect(200);

      expect(res.body).toHaveProperty('transaction');
      expect(res.body.transaction.status).toBe('SUCCESS');
      expect(res.body.transaction.employeeId).toBe(supervisorId);
      expect(res.body.transaction.gateId).toBe('GATE-BD-01');
      expect(res.body.transaction.eventType).toBe('CHECK_IN');
      expect(res.body.transaction.qrValidation).toBe('VALID');
      expect(res.body.message).toContain('Access granted');

      createdTxId = res.body.transaction.id;
    });

    it('denies access when CHECK_IN attempted on EXIT-only gate (Directionality check)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: validQrPayload,
          gateId: 'GATE-BD-02', // Turnstile Exit A (EXIT only)
          eventType: 'CHECK_IN',
          offline: false,
        })
        .expect(200);

      expect(res.body.transaction.status).toBe('DENIED');
      expect(res.body.transaction.denialReason).toBe('UNAUTHORIZED_GATE');
      expect(res.body.transaction.errorMessage).toContain(
        'Exit-only gate: check-in is not permitted at this station',
      );
      expect(res.body.message).toContain('Exit-only gate');
    });

    it('denies access when CHECK_OUT attempted on ENTRY-only gate', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: validQrPayload,
          gateId: 'GATE-BD-01', // Main Gate 1 (ENTRY only)
          eventType: 'CHECK_OUT',
          offline: false,
        })
        .expect(200);

      expect(res.body.transaction.status).toBe('DENIED');
      expect(res.body.transaction.denialReason).toBe('UNAUTHORIZED_GATE');
      expect(res.body.transaction.errorMessage).toContain(
        'Entry-only gate: check-out is not permitted at this station',
      );
    });

    it('denies access for unknown QR token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: 'tmc://v1/unknown-token-9999',
          gateId: 'GATE-BD-01',
          eventType: 'CHECK_IN',
        })
        .expect(200);

      expect(res.body.transaction.status).toBe('DENIED');
      expect(res.body.transaction.denialReason).toBe('UNKNOWN_QR');
      expect(res.body.transaction.qrValidation).toBe('INVALID');
    });

    it('denies access when gate station is OFFLINE in live mode', async () => {
      // Put gate offline
      await request(app.getHttpServer())
        .patch('/api/v1/gates/GATE-BD-03/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'OFFLINE' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/scan')
        .send({
          qrPayload: validQrPayload,
          gateId: 'GATE-BD-03',
          eventType: 'CHECK_IN',
          offline: false,
        })
        .expect(200);

      expect(res.body.transaction.status).toBe('DENIED');
      expect(res.body.transaction.denialReason).toBe('GATE_OFFLINE');

      // Restore gate online
      await request(app.getHttpServer())
        .patch('/api/v1/gates/GATE-BD-03/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ONLINE' })
        .expect(200);
    });
  });

  describe('GET /attendance/transactions', () => {
    it('returns paginated transactions list with utils pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('offset', 1);
      expect(res.body).toHaveProperty('limit', 25);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('filters transactions by employeeId and status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance/transactions?employeeId=TMC-BD-0001&status=SUCCESS')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const tx of res.body.data) {
        expect(tx.employeeId).toBe('TMC-BD-0001');
        expect(tx.status).toBe('SUCCESS');
      }
    });
  });

  describe('GET /attendance/transactions/:id', () => {
    it('returns single transaction details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/transactions/${createdTxId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdTxId);
      expect(res.body.employeeId).toBe('TMC-BD-0001');
      expect(res.body.gateId).toBe('GATE-BD-01');
    });

    it('returns 404 for non-existent transaction ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance/transactions/TX-NON-EXIST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /attendance/daily-summary', () => {
    it('returns daily summary for Supervisor with worked/late minutes', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/attendance/daily-summary?date=${today}&factoryId=BD`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');

      const empRecord = res.body.data.find(
        (r: any) => r.employeeId === 'TMC-BD-0001',
      );
      if (empRecord) {
        expect(empRecord.firstCheckIn).toBeDefined();
        expect(['PRESENT', 'LATE']).toContain(empRecord.status);
      }
    });

    it('rejects access to daily-summary for normal EMPLOYEE role', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/attendance/daily-summary')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);
    });
  });

  describe('GET /attendance/dashboard', () => {
    it('returns aggregated KPIs, attendance rate, and factory breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('kpis');
      expect(res.body.kpis).toHaveProperty('totalEmployees');
      expect(res.body.kpis).toHaveProperty('presentToday');
      expect(res.body.kpis).toHaveProperty('gateTrafficToday');
      expect(res.body).toHaveProperty('trend');
      expect(res.body).toHaveProperty('distribution');
      expect(res.body).toHaveProperty('recentEvents');
      expect(res.body).toHaveProperty('factoryComparison');
      expect(res.body).toHaveProperty('attendanceRate');
      expect(res.body).toHaveProperty('factoryBreakdown');
      expect(res.body).toHaveProperty('gateDistribution');
      expect(res.body).toHaveProperty('recentActivity');
    });
  });

  describe('Offline Sync Support (/attendance/sync)', () => {
    it('returns sync stats count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/attendance/sync/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('synced');
      expect(res.body).toHaveProperty('failed');
    });

    it('batches offline scan transactions from buffer', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sync/batch')
        .send({
          transactions: [
            {
              qrPayload: validQrPayload,
              gateId: 'GATE-BD-03',
              eventType: 'CHECK_IN',
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .expect(200);

      expect(res.body).toHaveProperty('processed', 1);
      expect(res.body).toHaveProperty('succeeded', 1);
      expect(res.body).toHaveProperty('results');
      expect(res.body.results).toHaveLength(1);
    });

    it('resolves all pending sync transactions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/attendance/sync/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('syncedCount');
      expect(res.body).toHaveProperty('message');
    });
  });
});
