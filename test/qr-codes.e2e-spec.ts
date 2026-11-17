import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/utils/filters/http-exception.filter';

describe('QR Codes Management (/qr-codes) (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let employeeToken: string;
  let testQrId: string;
  const testEmployeeId = 'TMC-BD-0001';

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
      .send({ email: 'admin@tmc.com', password: 'string' })
      .expect(200);
    adminToken = adminRes.body.accessToken;

    // Login as Employee (linked to TMC-BD-0006)
    const empRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'giang.do@tmc.com.vn', password: 'admin123' })
      .expect(200);
    employeeToken = empRes.body.accessToken;

    // Ensure TMC-BD-0001 has an active QR code before tests begin
    await request(app.getHttpServer())
      .post('/api/v1/qr-codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId: testEmployeeId });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /qr-codes', () => {
    it('returns paginated QR codes list for Admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('offset', 1);
      expect(res.body).toHaveProperty('limit', 25);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('totalPages');

      if (res.body.data.length > 0) {
        testQrId = res.body.data[0].id;
      }
    });

    it('supports utils pagination params (offset & limit)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-codes?offset=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.limit).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('totalPages');
    });

    it('rejects listing QR codes for normal EMPLOYEE role', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-codes')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('GET /qr-codes/my-qr', () => {
    it('returns active personal QR badge for the logged-in employee persona', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-codes/my-qr')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.employeeId).toBe('TMC-BD-0006');
      expect(res.body.status).toBe('ACTIVE');
      expect(res.body.payload).toContain('tmc://v1/bd/token-');
    });
  });

  describe('GET /qr-codes/employee/:employeeId', () => {
    it('returns active QR code for a specific employee', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/qr-codes/employee/${testEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.employeeId).toBe(testEmployeeId);
      expect(res.body.status).toBe('ACTIVE');
    });

    it('returns 404 if employee has no active QR code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/qr-codes/employee/TMC-NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('GET /qr-codes/:id', () => {
    it('returns QR code details by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/qr-codes/${testQrId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(testQrId);
      expect(res.body).toHaveProperty('payload');
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('POST /qr-codes/generate', () => {
    it('generates a fresh QR and revokes previous active codes', async () => {
      // First get existing active QR
      const beforeRes = await request(app.getHttpServer())
        .get(`/api/v1/qr-codes/employee/${testEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const oldQrId = beforeRes.body.id;

      // Issue new QR code
      const res = await request(app.getHttpServer())
        .post('/api/v1/qr-codes/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employeeId: testEmployeeId })
        .expect(201);

      expect(res.body.id).not.toBe(oldQrId);
      expect(res.body.employeeId).toBe(testEmployeeId);
      expect(res.body.status).toBe('ACTIVE');

      // Verify old QR code was revoked
      const oldRes = await request(app.getHttpServer())
        .get(`/api/v1/qr-codes/${oldQrId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(oldRes.body.status).toBe('REVOKED');
      testQrId = res.body.id;
    });

    it('rejects generate call by unauthorized role (EMPLOYEE)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/qr-codes/generate')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ employeeId: testEmployeeId })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('POST /qr-codes/:id/regenerate', () => {
    it('rotates/re-issues QR payload', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/qr-codes/${testQrId}/regenerate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).not.toBe(testQrId);
      expect(res.body.employeeId).toBe(testEmployeeId);
      expect(res.body.status).toBe('ACTIVE');
      testQrId = res.body.id;
    });
  });

  describe('PATCH /qr-codes/:id/status', () => {
    it('updates status to SUSPENDED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/qr-codes/${testQrId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' })
        .expect(200);

      expect(res.body.id).toBe(testQrId);
      expect(res.body.status).toBe('SUSPENDED');
    });
  });

  describe('POST /qr-codes/:id/revoke', () => {
    it('revokes the QR code', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/qr-codes/${testQrId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(testQrId);
      expect(res.body.status).toBe('REVOKED');
    });
  });
});
