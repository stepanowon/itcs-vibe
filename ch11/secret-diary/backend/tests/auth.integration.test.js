const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');
const { pool } = require('../src/infrastructure/db/pool');

const app = createApp();
const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const email = `be0619-${uniqueSuffix}@example.com`;
const username = `be0619user${uniqueSuffix}`;
const password = 'P@ssw0rd!';

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.end();
});

describe('POST /api/v1/auth/signup (BE-06)', () => {
  it('유효 입력 시 201 + UserProfile(id 포함)을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email, username, password });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.email).toBe(email);
    expect(res.body.username).toBe(username);
    expect(res.body.password).toBeUndefined();
  });

  it('email 중복 시 409를 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email, username: `${username}-2`, password });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('username 중복 시 409를 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: `dup-${email}`, username, password });
    expect(res.status).toBe(409);
  });

  it('형식 오류(비밀번호 8자 미만) 시 400 + 필드 메시지를 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: `x-${email}`, username: `x-${username}`, password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.details.some((d) => d.field === 'password')).toBe(true);
  });
});

describe('POST /api/v1/auth/login (BE-07)', () => {
  it('email + 비밀번호로 로그인 성공 시 200 + 토큰을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.tokenType).toBe('Bearer');
  });

  it('username + 비밀번호로도 로그인된다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: username, password });
    expect(res.status).toBe(200);
  });

  it('존재하지 않는 계정은 401 + 공통 메시지를 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'no-such-user@example.com', password });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });

  it('비밀번호 불일치 시 계정 없음과 동일한 메시지의 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
  });
});

describe('POST /api/v1/auth/refresh (BE-09) / POST /api/v1/auth/logout (BE-10)', () => {
  let tokens;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password });
    tokens = res.body;
  });

  it('유효한 Refresh Token으로 새 토큰 쌍을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(tokens.refreshToken); // 토큰 회전
  });

  it('회전으로 폐기된 이전 Refresh Token 재사용 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken });
    expect(res.status).toBe(401);
  });

  it('위조된 Refresh Token은 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-valid-jwt' });
    expect(res.status).toBe(401);
  });

  it('로그아웃 시 204를 반환하고 이후 재발급 시도는 401이 된다', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password });
    const { accessToken, refreshToken } = loginRes.body;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  it('인증 없이 로그아웃 요청 시 401을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'irrelevant' });
    expect(res.status).toBe(401);
  });
});
