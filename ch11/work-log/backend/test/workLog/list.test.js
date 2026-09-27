const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('GET /api/work-logs', () => {
  let accessTokenA;
  let userIdA;
  let accessTokenB;
  let userIdB;
  let a1Id;

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

    return { userId: signupRes.body.id, accessToken: loginRes.body.accessToken };
  };

  beforeAll(async () => {
    const userA = await signupAndLogin();
    userIdA = userA.userId;
    accessTokenA = userA.accessToken;

    const a1Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        logDate: '2026-07-13',
        isCompleted: true,
        title: 'a1',
        content: 'c1',
      });
    expect(a1Res.status).toBe(201);
    a1Id = a1Res.body.id;

    const a2Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        logDate: '2026-07-14',
        isCompleted: false,
        title: 'a2',
        content: 'c2',
      });
    expect(a2Res.status).toBe(201);

    const a3Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        logDate: '2026-07-15',
        isCompleted: true,
        title: 'a3',
        content: 'c3',
      });
    expect(a3Res.status).toBe(201);

    const userB = await signupAndLogin();
    userIdB = userB.userId;
    accessTokenB = userB.accessToken;

    const b1Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenB}`)
      .send({
        logDate: '2026-07-13',
        title: 'b1',
        content: 'c1',
        isCompleted: true,
      });
    expect(b1Res.status).toBe(201);
  });

  afterAll(async () => {
    if (userIdA) {
      await pool.query('DELETE FROM work_logs WHERE user_id = $1', [userIdA]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userIdA]);
      await pool.query('DELETE FROM users WHERE id = $1', [userIdA]);
    }
    if (userIdB) {
      await pool.query('DELETE FROM work_logs WHERE user_id = $1', [userIdB]);
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userIdB]);
      await pool.query('DELETE FROM users WHERE id = $1', [userIdB]);
    }
    await pool.end();
  });

  it('필터 없이 조회 시 로그인 사용자의 업무일지만 반환한다', async () => {
    const res = await request(app)
      .get('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(3);
    expect(res.body.items.some((item) => item.title === 'b1')).toBe(false);
  });

  it('isCompleted 필터로 조회하면 완료 여부가 일치하는 항목만 반환한다', async () => {
    const res = await request(app)
      .get('/api/work-logs')
      .query({ isCompleted: 'true' })
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    const titles = res.body.items.map((item) => item.title).sort();
    expect(titles).toEqual(['a1', 'a3']);
  });

  it('page/limit로 페이지네이션한다', async () => {
    const res = await request(app)
      .get('/api/work-logs')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.total).toBe(3);
  });

  it('소프트 삭제된 항목은 목록에서 제외된다', async () => {
    expect(a1Id).toBeTruthy();
    await pool.query('UPDATE work_logs SET is_deleted = true WHERE id = $1', [a1Id]);

    const res = await request(app)
      .get('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(2);
    expect(res.body.items.some((item) => item.title === 'a1')).toBe(false);
  });

  it('Authorization 헤더 없이 요청 시 401을 반환한다', async () => {
    const res = await request(app).get('/api/work-logs');

    expect(res.status).toBe(401);
  });
});
