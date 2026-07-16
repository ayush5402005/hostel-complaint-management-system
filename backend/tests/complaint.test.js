const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

let adminToken;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin_10@hostel.com', password: 'Admin_10@123' });
  adminToken = res.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/complaints — pagination + role scoping', () => {
  it('returns a Spring-Page-shaped response for staff', async () => {
    const res = await request(app)
      .get('/api/complaints?page=0&size=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('content');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('totalElements');
    expect(res.body.content.length).toBeLessThanOrEqual(5);
  });

  it('filters by status', async () => {
    const res = await request(app)
      .get('/api/complaints?status=CLOSED&size=50')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    for (const c of res.body.content) {
      expect(c.status).toBe('CLOSED');
    }
  });
});

describe('POST /api/complaints — validation', () => {
  it('rejects a missing title/description/category', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('rejects staff (non-student) from creating a complaint', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test complaint title', description: 'Something broke in the room', category: 'ELECTRICAL' });
    // Admin passes validation but is rejected by the service-layer role check.
    expect(res.status).toBe(403);
  });
});

describe('Admin dashboard stats — known scrambled-field quirk carried over from Java', () => {
  it('GET /api/admin/dashboard-stats keeps the original field-order bug (see MIGRATION_NOTES.md)', async () => {
    const [adminStats, correctStats] = await Promise.all([
      request(app).get('/api/admin/dashboard-stats').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/complaints/dashboard').set('Authorization', `Bearer ${adminToken}`),
    ]);
    expect(adminStats.status).toBe(200);
    expect(correctStats.status).toBe(200);
    // The buggy endpoint's `closed` mirrors the correct endpoint's `rejected`
    // count, and its `rejected` is always 0 — this is intentional parity
    // with the original Spring Boot bug, not a new regression.
    expect(adminStats.body.rejected).toBe(0);
    expect(adminStats.body.closed).toBe(correctStats.body.rejected);
  });
});
