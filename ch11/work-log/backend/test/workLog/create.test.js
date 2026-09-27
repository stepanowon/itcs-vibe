const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('POST /api/work-logs', () => {
  let accessToken;
  let userId;
  let createdId;

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
    accessToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM work_logs WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  const buildPayload = (overrides = {}) => ({
    logDate: '2026-07-17',
    title: '업무일지 제목',
    content: '업무일지 내용',
    issueSolution: '이슈 및 해결 방안',
    isCompleted: true,
    tomorrowPlan: '내일 계획',
    ...overrides,
  });

  it('정상 작성 시 201과 생성된 업무일지 정보를 반환한다', async () => {
    const payload = buildPayload();

    const res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.logDate).toBe(payload.logDate);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.content).toBe(payload.content);
    expect(res.body.isCompleted).toBe(payload.isCompleted);
    expect(res.body.issueSolution).toBe(payload.issueSolution);
    expect(res.body.tomorrowPlan).toBe(payload.tomorrowPlan);
    expect(res.body.dayOfWeek).toBe('FRIDAY');
    expect(res.body.createdAt).toBeTruthy();
    expect(res.body.updatedAt).toBeTruthy();
    expect(res.body.userId).toBeUndefined();

    createdId = res.body.id;
  });

  it('필수 필드(title) 누락 시 400을 반환한다', async () => {
    const payload = buildPayload();
    delete payload.title;

    const res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('동일 사용자가 같은 logDate로 재작성 시 409를 반환한다', async () => {
    expect(createdId).toBeTruthy();
    const payload = buildPayload();

    const res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(409);
  });

  it('Authorization 헤더 없이 요청 시 401을 반환한다', async () => {
    const payload = buildPayload({ logDate: '2026-07-20' });

    const res = await request(app).post('/api/work-logs').send(payload);

    expect(res.status).toBe(401);
  });
});
