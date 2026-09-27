const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('REFRESH', tag);

describe('POST /api/v1/auth/refresh', () => {
  afterAll(() => pool.end());

  it('유효한 refreshToken으로 재발급 시 200과 새 토큰을 반환한다', async () => {
    const body = uniqueUser('ok');
    await request(app).post('/api/v1/auth/signup').send(body);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginRes.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('위조된 refreshToken 문자열로 요청 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-token' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('만료된 refreshToken으로 요청 시 401을 반환한다', async () => {
    const expiredToken = jwt.sign(
      { userId: 'u-expired', role: 'employee' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });
});
