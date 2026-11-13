import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/utils/filters/http-exception.filter';

describe('Gate Station Controller (/gates) (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let employeeToken: string;
  let securityToken: string;

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

    // Login as Employee
    const empRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'giang.do@tmc.com.vn', password: 'admin123' })
      .expect(200);
    employeeToken = empRes.body.accessToken;

    // Login as Security Guard
    const secRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'canh.le@tmc.com.vn', password: 'admin123' })
      .expect(200);
    securityToken = secRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /gates', () => {
    it('returns list of seeded gate stations with live status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);

      const gate = res.body.data.find((g: any) => g.id === 'GATE-BD-01');
      expect(gate).toBeDefined();
      expect(gate.name).toBe('Main Gate 1 (Entry)');
      expect(gate.status).toBe('ONLINE');
      expect(gate.type).toBe('ENTRY');
      expect(gate.factoryId).toBe('BD');
    });

    it('filters gates by factoryId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gates?factoryId=LA')
        .set('Authorization', `Bearer ${employeeToken}`)
        .expect(200);

      for (const gate of res.body.data) {
        expect(gate.factoryId).toBe('LA');
      }
    });

    it('supports utils pagination params (page/pageSize & offset/limit)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gates?offset=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.pageSize).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /gates/:id', () => {
    it('returns gate detail with specs, 7-day stats, and recent events', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gates/GATE-BD-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('gate');
      expect(res.body.gate.id).toBe('GATE-BD-01');
      expect(res.body).toHaveProperty('stats7Days');
      expect(res.body.stats7Days).toHaveProperty('totalScans');
      expect(res.body.stats7Days).toHaveProperty('successfulScans');
      expect(res.body.stats7Days).toHaveProperty('deniedScans');
      expect(res.body.stats7Days).toHaveProperty('dailyBreakdown');
      expect(res.body).toHaveProperty('recentEvents');
    });

    it('returns 404 for non-existent gate station', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/gates/GATE-NON-EXIST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /gates', () => {
    it('registers new gate station for Admin', async () => {
      const newGateId = `GATE-BD-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/gates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          id: newGateId,
          name: 'Testing Station 99',
          factoryId: 'BD',
          type: 'BIDIRECTIONAL',
          location: 'Building C Main Entrance',
          ipAddress: '192.168.1.199',
          firmwareVersion: 'v2.5.0',
        })
        .expect(201);

      expect(res.body.id).toBe(newGateId);
      expect(res.body.name).toBe('Testing Station 99');
      expect(res.body.status).toBe('ONLINE');
    });

    it('rejects gate creation from non-admin role', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/gates')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Gate',
          factoryId: 'BD',
          type: 'ENTRY',
          location: 'Nowhere',
        })
        .expect(403);
    });
  });

  describe('PATCH /gates/:id', () => {
    it('updates gate properties for Admin', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/gates/GATE-BD-03')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Turnstile B (Updated)',
          location: 'Gate 2 Renovated Wing',
        })
        .expect(200);

      expect(res.body.name).toBe('Turnstile B (Updated)');
      expect(res.body.location).toBe('Gate 2 Renovated Wing');
    });
  });

  describe('PATCH /gates/:id/status', () => {
    it('allows Security Guard to update operational status', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/gates/GATE-BD-02/status')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ status: 'MAINTENANCE' })
        .expect(200);

      expect(res.body.status).toBe('MAINTENANCE');

      // Reset back to ONLINE
      await request(app.getHttpServer())
        .patch('/api/v1/gates/GATE-BD-02/status')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ status: 'ONLINE' })
        .expect(200);
    });
  });

  describe('POST /gates/:id/heartbeat', () => {
    it('accepts hardware heartbeat ping and updates timestamp', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/gates/GATE-BD-01/heartbeat')
        .expect(200);

      expect(res.body.id).toBe('GATE-BD-01');
      expect(res.body.status).toBe('ONLINE');
      expect(res.body.lastHeartbeatAt).toBeDefined();
    });
  });
});

