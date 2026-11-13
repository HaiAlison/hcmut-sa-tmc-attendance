import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/utils/filters/http-exception.filter';

describe('Auth & Global Conventions (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Global Standard Error Envelope', () => {
    it('returns standard error envelope on 400 Bad Request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '' })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('error', 'Bad Request');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body).toHaveProperty('timestamp');
      // ISO-8601 validation
      expect(new Date(response.body.timestamp).toISOString()).toBe(
        response.body.timestamp,
      );
    });

    it('returns standard error envelope on 401 Unauthorized when accessing protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('1. Authentication & Identity (/auth)', () => {
    let accessToken: string;
    let refreshToken: string;
    let cookieHeader: string;

    it('POST /api/v1/auth/login - returns JWT pair & user profile and sets refresh cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@tmc.com',
          password: 'string',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toEqual({
        id: 'USR-001',
        name: 'Nguyen Van Admin',
        email: 'admin@tmc.com',
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
        linkedEmployeeId: 'TMC-BD-0001',
      });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      cookieHeader = cookies[0];
      expect(cookieHeader).toContain('refreshToken=');
    });

    it('GET /api/v1/auth/me - fetches authenticated user profile and permissions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: 'USR-001',
        name: 'Nguyen Van Admin',
        email: 'admin@tmc.com',
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
        linkedEmployeeId: 'TMC-BD-0001',
        permissions: [
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
      });
    });

    it('POST /api/v1/auth/refresh - refreshes access token using body', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('admin@tmc.com');

      // Update tokens
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('POST /api/v1/auth/refresh - refreshes access token using cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      accessToken = response.body.accessToken;
    });

    it('POST /api/v1/auth/logout - invalidates session and clears cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Logged out successfully',
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=;/);
    });

    it('POST /api/v1/auth/refresh - rejects previously logged-out refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
