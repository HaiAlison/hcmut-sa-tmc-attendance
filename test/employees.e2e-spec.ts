import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from '../src/utils/filters/http-exception.filter';

describe('Employees Management (/employees) (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let employeeToken: string;
  let createdEmployeeId: string;

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

    // Ensure TMC-BD-0001 has active QR code
    const qrRepo = moduleFixture.get('QrCodeEntityRepository');
    if (qrRepo) {
      await qrRepo.update({ employeeId: 'TMC-BD-0001' }, { status: 'ACTIVE' });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /employees', () => {
    it('returns paginated employees list with active QR status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('pageSize', 25);

      if (res.body.data.length > 0) {
        const emp = res.body.data[0];
        expect(emp).toHaveProperty('id');
        expect(emp).toHaveProperty('fullName');
        expect(emp).toHaveProperty('departmentId');
        expect(emp).toHaveProperty('departmentName');
        expect(emp).toHaveProperty('factoryId');
        expect(emp).toHaveProperty('qrStatus');
      }
    });

    it('filters employees by keyword q', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees?q=Nguyen')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].fullName).toContain('Nguyen');
    });

    it('filters employees by factoryId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees?factoryId=BD')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      for (const emp of res.body.data) {
        expect(emp.factoryId).toBe('BD');
      }
    });

    it('supports utils pagination params (page & limit)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees?offset=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.limit).toBe(2);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('totalItems');
      expect(res.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /employees/:id', () => {
    it('returns employee details with active QR code', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees/TMC-BD-0001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('employee');
      expect(res.body.employee.id).toBe('TMC-BD-0001');
      expect(res.body).toHaveProperty('qrCode');
      expect(res.body.qrCode).not.toBeNull();
      expect(res.body.qrCode.status).toBe('ACTIVE');
      expect(res.body.qrCode.payload).toContain('tmc://v1/bd/token-');
    });

    it('returns 404 for non-existent employee ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/employees/TMC-NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('POST /employees', () => {
    it('creates new employee with auto-generated ID and active QR code', async () => {
      const newEmpDto = {
        fullName: 'Tran Thi Mai',
        departmentId: 'BD-PROD',
        position: 'Assembly Technician',
        factoryId: 'BD',
        email: `mai.tran.${Date.now()}@tmc.com`,
        phone: '+84 912 345 678',
        hireDate: '2026-11-01',
        dateOfBirth: '1995-04-12',
        gender: 'F',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newEmpDto)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toMatch(/^TMC-BD-\d{4}$/);
      expect(res.body.fullName).toBe('Tran Thi Mai');
      expect(res.body.employmentStatus).toBe('PROBATION');
      expect(res.body.qrStatus).toBe('ACTIVE');

      createdEmployeeId = res.body.id;

      // Verify created employee's detail and QR code
      const detailRes = await request(app.getHttpServer())
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(detailRes.body.qrCode).toBeDefined();
      expect(detailRes.body.qrCode.status).toBe('ACTIVE');
    });

    it('rejects employee creation by unauthorized roles (e.g. EMPLOYEE)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          fullName: 'Unauthorized Create',
          departmentId: 'BD-PROD',
          position: 'Operator',
          factoryId: 'BD',
          email: 'unauthorized@tmc.com',
          phone: '+84 999 888 777',
          hireDate: '2026-11-01',
          dateOfBirth: '1995-04-12',
          gender: 'M',
        })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });
  });

  describe('PUT /employees/:id', () => {
    it('updates employee information successfully', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          position: 'Senior Assembly Technician',
          phone: '+84 912 999 888',
        })
        .expect(200);

      expect(res.body.id).toBe(createdEmployeeId);
      expect(res.body.position).toBe('Senior Assembly Technician');
      expect(res.body.phone).toBe('+84 912 999 888');
    });
  });

  describe('PATCH /employees/:id/status', () => {
    it('updates employment status and suspends QR code when SUSPENDED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/employees/${createdEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ employmentStatus: 'SUSPENDED' })
        .expect(200);

      expect(res.body.employmentStatus).toBe('SUSPENDED');
      expect(res.body.qrStatus).toBe('SUSPENDED');
    });
  });

  describe('DELETE /employees/:id', () => {
    it('soft deletes employee and revokes active QR code', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toEqual({ message: 'Employee deleted successfully' });

      // Verifying subsequent GET /employees/:id returns 404 Not Found
      await request(app.getHttpServer())
        .get(`/api/v1/employees/${createdEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
