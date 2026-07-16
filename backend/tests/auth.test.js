const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

// Integration tests run against the real configured DATABASE_URL (same DB
// the app uses) — they only read/authenticate, never mutate seed data, so
// they're safe to run repeatedly without a dedicated test database.

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register — validation parity with RegisterRequest/AuthService', () => {
  it('rejects when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@stu.manit.ac.in' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Required fields are missing');
  });

  it('rejects a non-college email domain', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@gmail.com',
      password: 'secret123',
      phoneNumber: '9999999999',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/@stu\.manit\.ac\.in/);
  });

  it('rejects self-registration with a non-STUDENT role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@stu.manit.ac.in',
      password: 'secret123',
      phoneNumber: '9999999999',
      role: 'ADMIN',
    });
    expect(res.status).toBe(403);
  });

  it('rejects a missing/invalid block (Hostel-10 scoping: only A/B are valid)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test',
      email: 'test@stu.manit.ac.in',
      password: 'secret123',
      phoneNumber: '9999999999',
      scholarNumber: '2311601999',
      roomNumber: '101',
      block: 'C',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/block/i);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a JWT for the seeded admin account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_10@hostel.com', password: 'Admin_10@123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.role).toBe('ADMIN');
  });

  it('rejects an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@nowhere.com', password: 'x' });
    expect(res.status).toBe(404);
  });

  it('rejects a wrong password for a known account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_10@hostel.com', password: 'definitely-wrong' });
    expect(res.status).toBe(401);
  });
});

describe('Auth middleware', () => {
  it('rejects protected routes with no token', async () => {
    const res = await request(app).get('/api/complaints');
    expect(res.status).toBe(401);
  });

  it('rejects protected routes with a garbage token', async () => {
    const res = await request(app).get('/api/complaints').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
