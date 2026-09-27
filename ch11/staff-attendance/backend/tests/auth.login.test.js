const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('LOGIN', tag);

const signup = (body) => request(app).post('/api/v1/auth/signup').send(body);

describe('POST /api/v1/auth/login', () => {
  afterAll(() => pool.end());

  it('올바른 이메일/비밀번호로 로그인 시 200과 토큰을 반환한다', async () => {
    const body = uniqueUser('ok');
    await signup(body);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.expiresIn).toBeDefined();
  });

  it('잘못된 비밀번호로 로그인 시 401과 INVALID_CREDENTIALS를 반환한다', async () => {
    const body = uniqueUser('wrongpw');
    await signup(body);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('status가 inactive인 계정으로 로그인 시 403을 반환한다', async () => {
    const body = uniqueUser('inactive');
    await signup(body);
    await pool.query('UPDATE users SET status = $1 WHERE email = $2', ['inactive', body.email]);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('INACTIVE_ACCOUNT');
  });
});
