const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('PATCH /api/users/me/password', () => {
  let accessToken;
  let userId;
  let email;
  let initialPassword;
  const newPassword = '새비밀번호1234';

  let otherAccessToken;
  let otherUserId;

  const signupAndLogin = async () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    const payload = {
      email: `test-${suffix}@example.com`,
      password: 'password123',
      name: '홍길동',
      department: '개발팀',
    };

    const signupRes = await request(app).post('/api/auth/signup').send(payload);
    expect(signupRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.status).toBe(200);

    return {
      userId: signupRes.body.id,
      accessToken: loginRes.body.accessToken,
      email: payload.email,
      password: payload.password,
    };
  };

  beforeAll(async () => {
    const account = await signupAndLogin();
    userId = account.userId;
    accessToken = account.accessToken;
    email = account.email;
    initialPassword = account.password;

    const otherAccount = await signupAndLogin();
    otherUserId = otherAccount.userId;
    otherAccessToken = otherAccount.accessToken;
  });

  afterAll(async () => {
    for (const id of [userId, otherUserId]) {
      if (id) {
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
      }
    }
    await pool.end();
  });

  it('정상 변경 시 204를 반환하고 이후 새 비밀번호로만 로그인된다', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ currentPassword: initialPassword, newPassword });

    expect(res.status).toBe(204);

    const oldLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: initialPassword });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });
    expect(newLoginRes.status).toBe(200);
  });

  it('기존 패스워드가 일치하지 않으면 400을 반환한다', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ currentPassword: 'wrong-password', newPassword: '아무거나1234' });

    expect(res.status).toBe(400);
  });

  it('currentPassword 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ newPassword: '아무거나1234' });

    expect(res.status).toBe(400);
  });

  it('newPassword 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ currentPassword: 'password123' });

    expect(res.status).toBe(400);
  });

  it('Authorization 헤더 없이 변경 시도 시 401을 반환한다', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .send({ currentPassword: 'password123', newPassword: '아무거나1234' });

    expect(res.status).toBe(401);
  });
});
