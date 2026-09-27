const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('LOGOUT', tag);

describe('POST /api/v1/auth/logout', () => {
  afterAll(() => pool.end());

  it('유효한 accessToken으로 로그아웃 시 204를 반환한다', async () => {
    const body = uniqueUser('ok');
    await request(app).post('/api/v1/auth/signup').send(body);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it('토큰 없이 로그아웃 시도 시 401을 반환한다', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(401);
  });
});
