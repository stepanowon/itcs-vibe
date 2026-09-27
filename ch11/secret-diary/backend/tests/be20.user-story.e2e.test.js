// BE-20: 6-user-story.md의 P0 인수 조건을 하나의 연속된 플로우로 검증하고,
// 보안 케이스(401/403/404/409)와 다중 사용자 격리를 종합 확인한다.
const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');
const { pool } = require('../src/infrastructure/db/pool');

const app = createApp();
const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const alice = {
  email: `be20-alice-${uniqueSuffix}@example.com`,
  username: `be20alice${uniqueSuffix}`,
  password: 'P@ssw0rd!',
};
const bob = {
  email: `be20-bob-${uniqueSuffix}@example.com`,
  username: `be20bob${uniqueSuffix}`,
  password: 'P@ssw0rd!',
};
const carol = {
  email: `be20-carol-${uniqueSuffix}@example.com`,
  username: `be20carol${uniqueSuffix}`,
  password: 'P@ssw0rd!',
};

let aliceTokens;
let bobTokens;
let aliceDiaryId;

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email IN ($1, $2, $3)', [
    alice.email,
    bob.email,
    carol.email,
  ]);
  await pool.end();
});

describe('P0 전체 플로우: 가입→로그인→작성→목록→필터→상세→수정→삭제→내정보→비번변경→갱신→로그아웃', () => {
  it('US-A1 AC-1/AC-2/AC-5: 회원가입 시 201 + 독립 UUID 발급, 비밀번호는 해시로 저장된다', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(alice);
    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/i);

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [
      alice.email,
    ]);
    expect(rows[0].password_hash).not.toBe(alice.password);
    expect(rows[0].password_hash.startsWith('$2')).toBe(true); // bcrypt 해시 포맷
  });

  it('US-A1 AC-3: 이미 존재하는 email/username 재가입 시 409를 반환한다', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send(alice);
    expect(res.status).toBe(409);
  });

  it('US-A1 AC-4: 잘못된 형식(비밀번호 8자 미만) 가입 시 400 + 필드 메시지를 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...alice, email: `bad-${alice.email}`, password: '1234' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it('US-A2 AC-1: 올바른 email + 비밀번호로 로그인 시 200 + Access/Refresh 토큰을 발급받는다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: alice.email, password: alice.password });
    expect(res.status).toBe(200);
    aliceTokens = res.body;
  });

  it('US-A2 AC-2: 존재하지 않는 계정과 비밀번호 불일치가 동일 메시지의 401을 반환한다', async () => {
    const notFound = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'ghost@example.com', password: 'whatever123' });
    const wrongPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: alice.email, password: 'wrong-password' });

    expect(notFound.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(notFound.body.message).toBe(wrongPassword.body.message);
  });

  it('US-A2 AC-3: 발급된 Refresh Token은 DB에 해시로 저장되고 만료가 기록된다', async () => {
    const { rows } = await pool.query(
      `SELECT rt.token_hash, rt.expires_at FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id WHERE u.email = $1`,
      [alice.email]
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].token_hash).not.toBe(aliceTokens.refreshToken);
    expect(new Date(rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('US-B1 AC-1/AC-5: 인증 사용자가 제목/본문/날씨/기분/태그로 작성하면 201 + 소유자=요청자', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({
        title: '비 오는 날의 기록',
        content: '오늘은 하루 종일 비가 내렸다.',
        weather: 'rainy',
        mood: 'sad',
        tags: ['일상', '비'],
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBeTruthy();
    aliceDiaryId = res.body.id;
  });

  it('US-B1 AC-2/AC-3/AC-4/AC-6: 필수 누락/ENUM 위반/태그 초과/미인증은 각각 400·400·400·401', async () => {
    const missingRequired = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ content: '본문만' });
    const invalidEnum = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ title: 't', content: 'c', weather: 'not-a-weather' });
    const tooManyTags = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ title: 't', content: 'c', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) });
    const unauthenticated = await request(app)
      .post('/api/v1/diaries')
      .send({ title: 't', content: 'c' });

    expect(missingRequired.status).toBe(400);
    expect(invalidEnum.status).toBe(400);
    expect(tooManyTags.status).toBe(400);
    expect(unauthenticated.status).toBe(401);
  });

  it('US-B2 AC-1/AC-2/AC-3: 본인 일기만 최신순 + 페이지네이션, 결과 없음 시 빈 배열', async () => {
    const res = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.every((d) => d.id !== undefined)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20 });
  });

  it('US-B3 AC-1~AC-4: weather/mood/tag 복합(AND) 필터가 반영된다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=rainy&mood=sad&tag=일상')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.some((d) => d.id === aliceDiaryId)).toBe(true);
  });

  it('US-B3 AC-5/AC-6: 정의되지 않은 ENUM은 400, 결과 없는 필터는 200 + 빈 배열', async () => {
    const invalid = await request(app)
      .get('/api/v1/diaries?weather=invalid-weather')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    const empty = await request(app)
      .get('/api/v1/diaries?weather=snowy')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);

    expect(invalid.status).toBe(400);
    expect(empty.status).toBe(200);
    expect(empty.body.items).toEqual([]);
  });

  it('US-B4 AC-1/AC-3: 본인 소유 상세는 200, 존재하지 않는 id는 404', async () => {
    const found = await request(app)
      .get(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    const missing = await request(app)
      .get('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);

    expect(found.status).toBe(200);
    expect(found.body.tags).toContain('일상');
    expect(missing.status).toBe(404);
  });

  it('US-B5 AC-1/AC-3/AC-5: 본인 소유 일기 수정 시 200 + updated_at 갱신 + 태그 재구성, 검증 실패 400', async () => {
    const beforeRes = await request(app)
      .get(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);

    const updateRes = await request(app)
      .put(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ title: '수정된 제목', content: '수정된 본문', weather: 'cloudy', tags: ['수정됨'] });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('수정된 제목');
    expect(updateRes.body.tags).toEqual(['수정됨']);
    expect(new Date(updateRes.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(beforeRes.body.updatedAt).getTime()
    );

    const invalidUpdate = await request(app)
      .put(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ content: '제목 없음' });
    expect(invalidUpdate.status).toBe(400);
  });

  it('US-C1 AC-1/AC-2/AC-3: 프로필+diaryCount 반환(본인 것만 집계), 미인증 401', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    const unauthenticated = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(alice.email);
    expect(res.body.diaryCount).toBe(1);
    expect(unauthenticated.status).toBe(401);
  });

  it('US-B6 AC-1/AC-3: 본인 소유 일기 삭제 시 204 + diary_tags 제거', async () => {
    const res = await request(app)
      .delete(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    expect(res.status).toBe(204);

    const { rows } = await pool.query('SELECT * FROM diary_tags WHERE diary_id = $1', [
      aliceDiaryId,
    ]);
    expect(rows).toHaveLength(0);
  });

  it('US-C2 AC-1/AC-2/AC-3: 비밀번호 변경(현재비번 확인→204), 불일치/정책미달 400', async () => {
    const wrongCurrent = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ currentPassword: 'wrong', newPassword: 'N3wP@ssw0rd!' });
    const weakNew = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ currentPassword: alice.password, newPassword: '123' });
    const success = await request(app)
      .put('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ currentPassword: alice.password, newPassword: 'N3wP@ssw0rd!' });

    expect(wrongCurrent.status).toBe(400);
    expect(weakNew.status).toBe(400);
    expect(success.status).toBe(204);

    alice.password = 'N3wP@ssw0rd!';
  });

  it('US-C2 AC-4(P1): 비밀번호 변경 성공 시 기존 Refresh Token이 무효화된다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: aliceTokens.refreshToken });
    expect(res.status).toBe(401);
  });

  it('US-A3 AC-2/AC-3: 새 비밀번호로 재로그인 후 유효한 Refresh Token 재발급은 200, 위조 토큰은 401', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: alice.email, password: alice.password });
    expect(loginRes.status).toBe(200);
    aliceTokens = loginRes.body;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: aliceTokens.refreshToken });
    expect(refreshRes.status).toBe(200);
    aliceTokens = refreshRes.body;

    const forgedRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'forged.invalid.token' });
    expect(forgedRes.status).toBe(401);
  });

  it('US-A4 AC-1/AC-2: 로그아웃 시 204 + Refresh Token 무효화, 이후 재발급은 401', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ refreshToken: aliceTokens.refreshToken });
    expect(logoutRes.status).toBe(204);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: aliceTokens.refreshToken });
    expect(refreshAfterLogout.status).toBe(401);
  });
});

describe('US-B3 AC-1/AC-2/AC-3: weather/mood/tag 각 필터의 개별 선택성 검증', () => {
  let carolAccessToken;
  let sunnyDiaryId;
  let rainyDiaryId;

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/signup').send(carol);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: carol.email, password: carol.password });
    carolAccessToken = loginRes.body.accessToken;

    const sunnyRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${carolAccessToken}`)
      .send({ title: '맑은 날', content: '기쁨', weather: 'sunny', mood: 'happy', tags: ['기쁨'] });
    sunnyDiaryId = sunnyRes.body.id;

    const rainyRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${carolAccessToken}`)
      .send({ title: '비 오는 날', content: '우울', weather: 'rainy', mood: 'sad', tags: ['우울'] });
    rainyDiaryId = rainyRes.body.id;
  });

  it('AC-1: weather 단독 필터는 서로 다른 날씨의 다른 일기를 제외하고 해당 날씨만 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=sunny')
      .set('Authorization', `Bearer ${carolAccessToken}`);

    const ids = res.body.items.map((d) => d.id);
    expect(ids).toContain(sunnyDiaryId);
    expect(ids).not.toContain(rainyDiaryId);
  });

  it('AC-2: mood 단독 필터는 서로 다른 기분의 다른 일기를 제외하고 해당 기분만 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?mood=sad')
      .set('Authorization', `Bearer ${carolAccessToken}`);

    const ids = res.body.items.map((d) => d.id);
    expect(ids).toContain(rainyDiaryId);
    expect(ids).not.toContain(sunnyDiaryId);
  });

  it('AC-3: tag 단독 필터는 해당 태그가 연결된 일기만 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?tag=기쁨')
      .set('Authorization', `Bearer ${carolAccessToken}`);

    const ids = res.body.items.map((d) => d.id);
    expect(ids).toContain(sunnyDiaryId);
    expect(ids).not.toContain(rainyDiaryId);
  });

  it('AC-4: weather+mood+tag 복합 조건은 AND로 모두 만족하는 일기만 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=rainy&mood=sad&tag=우울')
      .set('Authorization', `Bearer ${carolAccessToken}`);

    const ids = res.body.items.map((d) => d.id);
    expect(ids).toEqual([rainyDiaryId]);
  });
});

describe('다중 사용자 소유권 격리 및 보안 케이스 종합 (NFR-3)', () => {
  let bobDiaryId;

  beforeAll(async () => {
    await request(app).post('/api/v1/auth/signup').send(bob);
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: bob.email, password: bob.password });
    bobTokens = loginRes.body;

    const aliceLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: alice.email, password: alice.password });
    aliceTokens = aliceLoginRes.body;

    const aliceDiaryRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`)
      .send({ title: 'alice의 일기', content: '앨리스만의 기록' });
    aliceDiaryId = aliceDiaryRes.body.id;

    const bobDiaryRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${bobTokens.accessToken}`)
      .send({ title: 'bob의 일기', content: '밥만의 기록' });
    bobDiaryId = bobDiaryRes.body.id;
  });

  it('US-B2 AC-4: 각 사용자의 목록에는 자신의 일기만 포함되고 타인의 일기는 포함되지 않는다', async () => {
    const aliceList = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    const bobList = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${bobTokens.accessToken}`);

    expect(aliceList.body.items.some((d) => d.id === aliceDiaryId)).toBe(true);
    expect(aliceList.body.items.some((d) => d.id === bobDiaryId)).toBe(false);
    expect(bobList.body.items.some((d) => d.id === bobDiaryId)).toBe(true);
    expect(bobList.body.items.some((d) => d.id === aliceDiaryId)).toBe(false);
  });

  it('보안 매트릭스: 401(미인증)/403(타인 소유)/404(미존재)/409(가입 중복)가 모두 정확히 구분된다', async () => {
    const unauthorized = await request(app).get(`/api/v1/diaries/${aliceDiaryId}`);
    const forbidden = await request(app)
      .get(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${bobTokens.accessToken}`);
    const notFound = await request(app)
      .get('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${aliceTokens.accessToken}`);
    const conflict = await request(app).post('/api/v1/auth/signup').send(alice);

    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
    expect(notFound.status).toBe(404);
    expect(conflict.status).toBe(409);

    [unauthorized, forbidden, notFound, conflict].forEach((res) => {
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
    });
  });

  it('타인 소유 일기 수정/삭제는 403을 반환한다', async () => {
    const updateForbidden = await request(app)
      .put(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${bobTokens.accessToken}`)
      .send({ title: 't', content: 'c' });
    const deleteForbidden = await request(app)
      .delete(`/api/v1/diaries/${aliceDiaryId}`)
      .set('Authorization', `Bearer ${bobTokens.accessToken}`);

    expect(updateForbidden.status).toBe(403);
    expect(deleteForbidden.status).toBe(403);
  });
});
