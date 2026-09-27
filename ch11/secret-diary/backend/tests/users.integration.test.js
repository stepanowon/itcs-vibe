const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');
const { pool } = require('../src/infrastructure/db/pool');

const app = createApp();
const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const email = `be1819-${uniqueSuffix}@example.com`;
const username = `be1819user${uniqueSuffix}`;
const password = 'P@ssw0rd!';
const newPassword = 'N3wP@ssw0rd!';

let accessToken;
let refreshToken;

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.end();
});

beforeAll(async () => {
  await request(app).post('/api/v1/auth/signup').send({ email, username, password });
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: email, password });
  accessToken = loginRes.body.accessToken;
  refreshToken = loginRes.body.refreshToken;
});

describe('GET /api/v1/users/me (BE-18)', () => {
  it('email·username·가입일과 diaryCount를 반환한다', async () => {
    await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '일기1', content: '내용1' });
    await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: '일기2', content: '내용2' });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.body.username).toBe(username);
    expect(res.body.diaryCount).toBe(2);
  });

  it('미인증 시 401을 반환한다', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v1/users/me/password (BE-19)', () => {
  it('현재 비밀번호 불일치 시 400을 반환한다', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: 'wrong-password', newPassword });
    expect(res.status).toBe(400);
  });

  it('새 비밀번호 정책 미달 시 400을 반환한다', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword: '123' });
    expect(res.status).toBe(400);
  });

  it('현재 비밀번호 확인 후 새 비밀번호로 갱신하고 204를 반환한다', async () => {
    const res = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: password, newPassword });
    expect(res.status).toBe(204);
  });

  it('변경된 비밀번호로 재로그인이 성공한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password: newPassword });
    expect(res.status).toBe(200);
  });

  it('(P1) 변경 성공 시 기존 Refresh Token이 무효화된다', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});
