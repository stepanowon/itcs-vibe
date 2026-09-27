const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('GET /api/users/me', () => {
  let accessToken;
  let userId;
  let signupPayload;
  let deletedLogId;

  beforeAll(async () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    signupPayload = {
      email: `test-${suffix}@example.com`,
      password: 'password123',
      name: '홍길동',
      department: '개발팀',
    };

    const signupRes = await request(app).post('/api/auth/signup').send(signupPayload);
    expect(signupRes.status).toBe(201);
    userId = signupRes.body.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: signupPayload.email, password: signupPayload.password });
    expect(loginRes.status).toBe(200);
    accessToken = loginRes.body.accessToken;

    const buildPayload = (overrides = {}) => ({
      logDate: '2026-07-17',
      title: '업무일지 제목',
      content: '업무일지 내용',
      isCompleted: true,
      ...overrides,
    });

    const log1 = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildPayload({ logDate: '2026-07-17' }));
    expect(log1.status).toBe(201);

    const log2 = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildPayload({ logDate: '2026-07-18' }));
    expect(log2.status).toBe(201);
    deletedLogId = log2.body.id;

    const deleteRes = await request(app)
      .delete(`/api/work-logs/${deletedLogId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(deleteRes.status).toBe(204);
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM work_logs WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  it('정상 조회 시 200과 내 정보/삭제 제외 업무일지 갯수를 반환한다', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.userCode).toBeTruthy();
    expect(res.body.email).toBe(signupPayload.email);
    expect(res.body.name).toBe(signupPayload.name);
    expect(res.body.department).toBe(signupPayload.department);
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.workLogCount).toBe(1);
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('Authorization 헤더 없이 조회 시 401을 반환한다', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
  });
});
