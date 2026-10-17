import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../services/authService';
import fs from 'fs';

describe('Nestora Backend Automated Test Suite', () => {
  let superAdminToken = '';
  let adminToken = '';
  let employeeToken = '';
  let createdPropertyId = '';
  let createdPropertyCode = '';
  let uploadedMediaId = '';
  let uploadedMediaPath = '';

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    const passwordHash = await hashPassword('NestoraSuperAdmin2026!');

    // 1. Authenticate as SuperAdmin & obtain token
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        username: 'superadmin',
        password: 'NestoraSuperAdmin2026!',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('Super Admin');
    expect(res.body.data.user.permissions).toHaveLength(8);
    superAdminToken = res.body.data.accessToken;

    // 2. Create and authenticate an Admin employee (role: Admin)
    const adminUsername = `adm_${testSuffix}`;
    const adminEmployee = await prisma.employee.upsert({
      where: { username: adminUsername },
      update: {},
      create: {
        username: adminUsername,
        passwordHash,
        name: 'Test Admin Role',
        role: 'Admin',
        status: 'Active',
      },
    });
    const adminLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        username: adminEmployee.username,
        password: 'NestoraSuperAdmin2026!',
      });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.accessToken;

    // 3. Create and authenticate an Employee user (role: Employee) with 0 initial overrides
    const empUsername = `emp_${testSuffix}`;
    const empEmployee = await prisma.employee.upsert({
      where: { username: empUsername },
      update: {},
      create: {
        username: empUsername,
        passwordHash,
        name: 'Test Employee Role',
        role: 'Employee',
        status: 'Active',
      },
    });
    const empLoginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        username: empEmployee.username,
        password: 'NestoraSuperAdmin2026!',
      });
    expect(empLoginRes.status).toBe(200);
    employeeToken = empLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup any temporary physical files uploaded during test
    if (uploadedMediaPath && fs.existsSync(uploadedMediaPath)) {
      try {
        fs.unlinkSync(uploadedMediaPath);
      } catch {}
    }
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. HEALTH CHECK
  // ==========================================
  describe('GET /api/v1/health', () => {
    it('should return 200 with status UP and database connected', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.message).toContain('database');
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & SECURITY
  // ==========================================
  describe('Authentication & Security Gateways', () => {
    it('should reject invalid password with 401 INVALID_CREDENTIALS', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({
          username: 'superadmin',
          password: 'WrongPassword123!',
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access to protected admin route without Bearer token', async () => {
      const res = await request(app).get('/api/v1/admin/properties');
      expect(res.status).toBe(401);
    });

    it('should allow public user registration and login', async () => {
      const regEmail = `public_user_${testSuffix}@test.com`;
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: regEmail,
          password: 'Password123!',
        });
      expect(regRes.status).toBe(201);
      expect(regRes.body.data.user.email).toBe(regEmail);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: regEmail,
          password: 'Password123!',
        });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
    });
  });

  // ==========================================
  // 3. RBAC AUTHORIZATION MATRIX
  // ==========================================
  describe('RBAC Authorization Matrix', () => {
    it('Super Admin can access employees (manage:employees)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/employees')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
    });

    it('Admin cannot access employees and receives 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/employees')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Admin can access properties (manage:properties)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/properties')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('Employee without override cannot access properties (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/properties')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 4. PROPERTIES LIFECYCLE & DRAFT VISIBILITY
  // ==========================================
  describe('Properties Lifecycle & Auto-Code Sequencing', () => {
    it('should create property in draft status with auto NST-### code', async () => {
      const payload = {
        title: `Test Estate Unit ${testSuffix}`,
        price: '₹95 Lakh',
        address: 'Gachibowli, Hyderabad, Telangana',
        beds: 3,
        baths: 3,
        sqft: 1850,
        type: 'For Sale',
        category: 'Residential',
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        status: 'draft',
      };

      const res = await request(app)
        .post('/api/v1/admin/properties')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.propertyCode).toMatch(/^NST-\d+$/);
      expect(res.body.data.status).toBe('draft');

      createdPropertyId = res.body.data.id;
      createdPropertyCode = res.body.data.propertyCode;
    });

    it('draft property should be hidden from public GET /api/v1/properties', async () => {
      const res = await request(app).get('/api/v1/properties');
      expect(res.status).toBe(200);
      const items = res.body.data.items || res.body.data;
      const found = items.find((p: any) => p.id === createdPropertyId || p.propertyCode === createdPropertyCode);
      expect(found).toBeUndefined();
    });

    it('publishing property makes it immediately available publicly', async () => {
      const patchRes = await request(app)
        .patch(`/api/v1/admin/properties/${createdPropertyId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'published' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('published');

      const pubRes = await request(app).get(`/api/v1/properties/${createdPropertyId}`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.id).toBe(createdPropertyId);
    });
  });

  // ==========================================
  // 5. MEDIA HOST DISK STORAGE & REFERENCE PROTECTION
  // ==========================================
  describe('Host Disk Media Storage & Reference Safety', () => {
    it('should upload image directly to host disk and serve via /uploads/', async () => {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const uploadRes = await request(app)
        .post('/api/v1/admin/media/upload')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .field('folder', 'properties')
        .attach('files', pngBuffer, `test_media_${testSuffix}.png`);

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.data.url).toMatch(/^\/uploads\/properties\//);
      uploadedMediaId = uploadRes.body.data.id;
      uploadedMediaPath = uploadRes.body.data.filePath;

      // Verify static HTTP access
      const staticRes = await request(app).get(uploadRes.body.data.url);
      expect(staticRes.status).toBe(200);
      expect(staticRes.headers['content-type']).toContain('image/png');
    });

    it('should reject deletion with 409 Conflict if image is referenced in property', async () => {
      const mediaUrl = (await prisma.mediaAsset.findUnique({ where: { id: uploadedMediaId } }))?.url;
      expect(mediaUrl).toBeDefined();

      await prisma.property.update({
        where: { id: createdPropertyId },
        data: { image: mediaUrl! },
      });

      const delRes = await request(app)
        .delete(`/api/v1/admin/media/${uploadedMediaId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(delRes.status).toBe(409);
      expect(delRes.body.error.code).toBe('REFERENCED_ASSET');
    });
  });

  // ==========================================
  // 6. ENQUIRIES PIPELINE
  // ==========================================
  describe('Enquiries Pipeline & Triage', () => {
    let enquiryId = '';

    it('public user submits enquiry successfully', async () => {
      const res = await request(app)
        .post('/api/v1/enquiries')
        .send({
          name: 'Robert Frost',
          email: 'robert@woods.com',
          phone: '+91 9876543210',
          type: 'property',
          serviceInterested: 'Villa Purchase',
          message: 'Interested in Gachibowli luxury property.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      enquiryId = res.body.data.id;
    });

    it('admin can triage enquiry status and add internal notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/enquiries/${enquiryId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          status: 'Contacted',
          priority: 'High',
          internalNotes: 'Client contacted via phone; scheduled call for Saturday.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Contacted');
      expect(res.body.data.priority).toBe('High');
      expect(res.body.data.internalNotes).toContain('Saturday');
    });
  });

  // ==========================================
  // 7. CMS SECTIONS & BULK UPDATE
  // ==========================================
  describe('CMS Content Management System', () => {
    it('public can fetch CMS sections', async () => {
      const res = await request(app).get('/api/v1/cms');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('admin can bulk-update CMS sections', async () => {
      const updateRes = await request(app)
        .put('/api/v1/admin/cms/bulk-update')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          sections: {
            hero: {
              badge: 'Hyderabad Premier Spaces',
              headline: 'Living Elevated',
              subheadline: 'Crafted with precision & style.',
            },
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);

      const getRes = await request(app).get('/api/v1/cms/hero');
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.headline).toBe('Living Elevated');
    });
  });

  // ==========================================
  // 8. DATA MIGRATION & DISASTER RECOVERY EXPORT
  // ==========================================
  describe('Disaster Recovery & Data Export', () => {
    it('admin export returns full database structure', async () => {
      const res = await request(app)
        .get('/api/v1/admin/migrate/export')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe('1.0.0');
      expect(res.body.data.counts).toBeDefined();
      expect(res.body.data.counts.properties).toBeGreaterThan(0);
      expect(res.body.data.payload.properties).toBeInstanceOf(Array);
      expect(res.body.data.payload.services).toBeInstanceOf(Array);
    });
  });
});
