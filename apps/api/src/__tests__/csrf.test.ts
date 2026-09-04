import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../http/app.js';
import crypto from 'crypto';
import { env } from '../config/env.js';

describe('CSRF Middleware Integration', () => {
  const app = createApp();
  const origin = env.CORS_ORIGIN;
  let testCsrfToken: string;
  let csrfCookie: string;

  beforeAll(() => {
    testCsrfToken = crypto.randomBytes(32).toString('base64url');
    csrfCookie = `csrfToken=${testCsrfToken}; Path=/`;
  });

  it('GET /api/v1/auth/csrf-token returns a token', async () => {
    const res = await request(app).get('/api/v1/auth/csrf-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.data.csrfToken).toBeDefined();
  });

  it('allows safe methods without CSRF token', async () => {
    const res = await request(app).get('/api/v1/auth/me'); // will 401 unauth, but not 403 CSRF
    expect(res.status).not.toBe(403);
  });

  it('blocks cookie-authenticated unsafe request missing X-CSRF-Token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', [`accessToken=dummy; ${csrfCookie}`]);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('blocks cookie-authenticated unsafe request with mismatched token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', [`accessToken=dummy; ${csrfCookie}`])
      .set('X-CSRF-Token', 'wrong-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid CSRF token');
  });

  it('blocks cookie-authenticated unsafe request with wrong Origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://evil.com')
      .set('Cookie', [`accessToken=dummy; ${csrfCookie}`])
      .set('X-CSRF-Token', testCsrfToken);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Invalid or missing Origin');
  });

  it('allows cookie-authenticated unsafe request with matching token and origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', origin)
      .set('Cookie', [`accessToken=dummy; ${csrfCookie}`])
      .set('X-CSRF-Token', testCsrfToken);
    // Logout might return 200, wait, logout doesn't require auth actually, but we pass valid tokens
    expect(res.status).not.toBe(403);
  });

  it('allows Bearer-authenticated unsafe request missing CSRF token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', 'Bearer dummy-token');
    expect(res.status).not.toBe(403);
  });

  it('allows login/register without CSRF token (no auth cookies)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ email: 'test@example.com', password: 'password' });
    // Will fail validation or auth, but not CSRF
    expect(res.status).not.toBe(403);
  });
});
