const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('POST /api/auth/signup', () => {
  const createdIds = [];

  const buildPayload = (overrides = {}) => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    return {
      email: `test-${suffix}@example.com`,
      password: 'password123',
      name: '홍길동',
      department: '개발팀',
      ...overrides,
    };
  };

  afterEach(async () => {
    if (createdIds.length > 0) {
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [createdIds]);
      createdIds.length = 0;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('정상 가입 시 201과 생성된 사용자 정보를 반환한다', async () => {
    const payload = buildPayload();

    const res = await request(app).post('/api/auth/signup').send(payload);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.userCode).toBeTruthy();
    expect(res.body.email).toBe(payload.email);
    expect(res.body.name).toBe(payload.name);
    expect(res.body.department).toBe(payload.department);
    expect(res.body.workLogCount).toBe(0);
    expect(res.body.createdAt).toBeTruthy();

    createdIds.push(res.body.id);
  });

  it('필수 필드(name) 누락 시 400과 VALIDATION_ERROR를 반환한다', async () => {
    const payload = buildPayload();
    delete payload.name;

    const res = await request(app).post('/api/auth/signup').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('password가 8자 미만이면 400을 반환한다', async () => {
    const payload = buildPayload({ password: '1234567' });

    const res = await request(app).post('/api/auth/signup').send(payload);

    expect(res.status).toBe(400);
  });

  it('이미 가입된 email로 재가입 시 409와 CONFLICT를 반환한다', async () => {
    const first = buildPayload();
    const firstRes = await request(app).post('/api/auth/signup').send(first);
    expect(firstRes.status).toBe(201);
    createdIds.push(firstRes.body.id);

    const second = buildPayload({ email: first.email });
    const secondRes = await request(app).post('/api/auth/signup').send(second);

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.code).toBe('CONFLICT');
  });

  it('회원가입 시 userCode가 자동 생성되고 매번 다른 값이 부여된다', async () => {
    const first = buildPayload();
    const firstRes = await request(app).post('/api/auth/signup').send(first);
    expect(firstRes.status).toBe(201);
    createdIds.push(firstRes.body.id);

    const second = buildPayload();
    const secondRes = await request(app).post('/api/auth/signup').send(second);
    expect(secondRes.status).toBe(201);
    createdIds.push(secondRes.body.id);

    expect(firstRes.body.userCode).not.toBe(secondRes.body.userCode);
  });
});
