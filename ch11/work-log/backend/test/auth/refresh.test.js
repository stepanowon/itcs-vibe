require('dotenv').config();
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('POST /api/auth/refresh, POST /api/auth/logout', () => {
  let userId;
  let latestRefreshToken;
  let firstRefreshToken;

  beforeAll(async () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    const payload = {
      email: `test-${suffix}@example.com`,
      password: 'password123',
      name: '홍길동',
      department: '개발팀',
    };

    const signupRes = await request(app).post('/api/auth/signup').send(payload);
    expect(signupRes.status).toBe(201);
    userId = signupRes.body.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.status).toBe(200);

    firstRefreshToken = loginRes.body.refreshToken;
    latestRefreshToken = loginRes.body.refreshToken;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  it('정상 재발급 시 200과 새로운 accessToken/refreshToken/tokenType을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: latestRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.refreshToken).not.toBe(latestRefreshToken);

    latestRefreshToken = res.body.refreshToken;
  });

  it('위조된 refreshToken으로 재발급 시 401을 반환한다', async () => {
    const forgedToken = jwt.sign({ sub: 'x' }, 'wrong-secret');

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: forgedToken });

    expect(res.status).toBe(401);
  });

  it('만료된 refreshToken으로 재발급 시 401을 반환한다', async () => {
    const expiredToken = jwt.sign({ sub: 'x' }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: -10,
    });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
  });

  it('이미 회전(폐기)된 옛 refreshToken으로 재발급 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: firstRefreshToken });

    expect(res.status).toBe(401);
  });

  it('refreshToken 누락 시 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});

    expect(res.status).toBe(400);
  });

  it('정상 로그아웃 시 204를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: latestRefreshToken });

    expect(res.status).toBe(204);
  });

  it('로그아웃 직후 같은 refreshToken으로 재발급 시도 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: latestRefreshToken });

    expect(res.status).toBe(401);
  });

  it('logout: refreshToken 누락 시 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/logout').send({});

    expect(res.status).toBe(400);
  });

  it('logout: 유효하지 않은 refreshToken으로 로그아웃 시 401을 반환한다', async () => {
    const forgedToken = jwt.sign({ sub: 'x' }, 'wrong-secret');

    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: forgedToken });

    expect(res.status).toBe(401);
  });
});
