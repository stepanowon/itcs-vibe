const request = require('supertest');
const app = require('../../src/interfaces/http/app');
const pool = require('../../src/infrastructure/db/pool');

describe('GET/PATCH/DELETE /api/work-logs/:id', () => {
  let accessTokenA;
  let userIdA;
  let accessTokenB;
  let userIdB;
  let log1Id;
  let log2Id;

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

    const log1Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        logDate: '2026-07-20',
        title: '업무일지1',
        content: '내용1',
        isCompleted: false,
      });
    expect(log1Res.status).toBe(201);
    log1Id = log1Res.body.id;

    const log2Res = await request(app)
      .post('/api/work-logs')
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({
        logDate: '2026-07-21',
        title: '업무일지2',
        content: '내용2',
        isCompleted: false,
      });
    expect(log2Res.status).toBe(201);
    log2Id = log2Res.body.id;

    const userB = await signupAndLogin();
    userIdB = userB.userId;
    accessTokenB = userB.accessToken;
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

  it('본인 업무일지 상세 조회 시 200과 상세 정보를 반환한다', async () => {
    const res = await request(app)
      .get(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(log1Id);
    expect(res.body.logDate).toBe('2026-07-20');
    expect(res.body.title).toBe('업무일지1');
    expect(res.body.dayOfWeek).toBeTruthy();
  });

  it('타 사용자의 업무일지 조회 시 403을 반환한다', async () => {
    const res = await request(app)
      .get(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenB}`);

    expect(res.status).toBe(403);
  });

  it('존재하지 않는 id 조회 시 404를 반환한다', async () => {
    const randomId = require('crypto').randomUUID();

    const res = await request(app)
      .get(`/api/work-logs/${randomId}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(404);
  });

  it('Authorization 헤더 없이 요청 시 401을 반환한다', async () => {
    const res = await request(app).get(`/api/work-logs/${log1Id}`);

    expect(res.status).toBe(401);
  });

  it('본인 업무일지 부분 수정 시 200과 반영된 정보를 반환한다', async () => {
    const res = await request(app)
      .patch(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({ title: '수정된 제목', isCompleted: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정된 제목');
    expect(res.body.isCompleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('수정된 제목');
    expect(getRes.body.isCompleted).toBe(true);
  });

  it('타 사용자의 업무일지 수정 시 403을 반환한다', async () => {
    const res = await request(app)
      .patch(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenB}`)
      .send({ title: '해킹시도' });

    expect(res.status).toBe(403);
  });

  it('logDate를 이미 존재하는 다른 날짜로 변경 시 409를 반환한다', async () => {
    const res = await request(app)
      .patch(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`)
      .send({ logDate: '2026-07-21' });

    expect(res.status).toBe(409);
  });

  it('본인 업무일지 삭제 시 204를 반환하고 소프트 삭제 처리한다', async () => {
    const res = await request(app)
      .delete(`/api/work-logs/${log2Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(204);

    const dbRes = await pool.query('SELECT is_deleted FROM work_logs WHERE id = $1', [log2Id]);
    expect(dbRes.rows.length).toBe(1);
    expect(dbRes.rows[0].is_deleted).toBe(true);
  });

  it('삭제된 업무일지 조회 시 404를 반환한다', async () => {
    const res = await request(app)
      .get(`/api/work-logs/${log2Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(404);
  });

  it('이미 삭제된 업무일지를 재삭제 시 404를 반환한다', async () => {
    const res = await request(app)
      .delete(`/api/work-logs/${log2Id}`)
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(res.status).toBe(404);
  });

  it('타 사용자의 업무일지 삭제 시 403을 반환한다', async () => {
    const res = await request(app)
      .delete(`/api/work-logs/${log1Id}`)
      .set('Authorization', `Bearer ${accessTokenB}`);

    expect(res.status).toBe(403);
  });
});
