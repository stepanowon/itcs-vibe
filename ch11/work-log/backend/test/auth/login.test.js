const crypto = require('crypto');
const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('POST /api/auth/login', () => {
  let credentials;
  let userId;

  beforeAll(async () => {
    const suffix = Date.now() + '-' + Math.floor(Math.random() * 10000);
    const payload = {
      email: `test-${suffix}@example.com`,
      password: 'password123',
      name: '홍길동',
      department: '개발팀',
    };

    const res = await request(app).post('/api/auth/signup').send(payload);
    expect(res.status).toBe(201);

    userId = res.body.id;
    credentials = { email: payload.email, password: payload.password };
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  it('정상 로그인 시 200과 accessToken/refreshToken/tokenType을 반환한다', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.tokenType).toBe('Bearer');
  });

  it('로그인 성공 시 refresh_tokens 테이블에 해시된 토큰이 저장된다', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials);
    expect(res.status).toBe(200);

    const { rows } = await pool.query(
      'SELECT token_hash FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );

    expect(rows.length).toBeGreaterThan(0);

    const expectedHash = crypto
      .createHash('sha256')
      .update(res.body.refreshToken)
      .digest('hex');

    const stored = rows.find((row) => row.token_hash === expectedHash);
    expect(stored).toBeTruthy();
    expect(stored.token_hash).not.toBe(res.body.refreshToken);
  });

  it('존재하지 않는 이메일로 로그인 시 401과 UNAUTHORIZED를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: `no-such-user-${Date.now()}@example.com`, password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 패스워드로 로그인 시 401과 UNAUTHORIZED를 반환한다', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('email 누락 시 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: credentials.password });

    expect(res.status).toBe(400);
  });

  it('password 누락 시 400을 반환한다', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: credentials.email });

    expect(res.status).toBe(400);
  });
});
