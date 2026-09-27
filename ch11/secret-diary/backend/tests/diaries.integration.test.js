const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');
const { pool } = require('../src/infrastructure/db/pool');

const app = createApp();
const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

const ownerEmail = `be1217-owner-${uniqueSuffix}@example.com`;
const otherEmail = `be1217-other-${uniqueSuffix}@example.com`;
const password = 'P@ssw0rd!';

let ownerAccessToken;
let otherAccessToken;
let createdDiaryId;

async function signupAndLogin(email, username) {
  await request(app).post('/api/v1/auth/signup').send({ email, username, password });
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: email, password });
  return res.body.accessToken;
}

beforeAll(async () => {
  ownerAccessToken = await signupAndLogin(ownerEmail, `owner${uniqueSuffix}`);
  otherAccessToken = await signupAndLogin(otherEmail, `other${uniqueSuffix}`);
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [ownerEmail, otherEmail]);
  await pool.end();
});

describe('POST /api/v1/diaries (BE-12)', () => {
  it('인증 사용자가 제목/본문/날씨/기분/태그로 작성하면 201을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({
        title: '비 오는 날의 기록',
        content: '오늘은 하루 종일 비가 내렸다.',
        weather: 'rainy',
        mood: 'sad',
        tags: ['일상', '비'],
      });

    createdDiaryId = res.body.id;

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('비 오는 날의 기록');
    expect(new Set(res.body.tags)).toEqual(new Set(['일상', '비']));
  });

  it('제목/본문 누락 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ content: '본문만 있음' });
    expect(res.status).toBe(400);
  });

  it('정의되지 않은 ENUM 값 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: 't', content: 'c', weather: 'unknown-weather' });
    expect(res.status).toBe(400);
  });

  it('태그 10개 초과 시 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: 't', content: 'c', tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) });
    expect(res.status).toBe(400);
  });

  it('미인증 요청은 401을 반환한다', async () => {
    const res = await request(app).post('/api/v1/diaries').send({ title: 't', content: 'c' });
    expect(res.status).toBe(401);
  });
});

describe('diaryDate (지난 날짜 지정 가능)', () => {
  it('diaryDate 미입력 시 오늘 날짜로 기본 설정된다', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '날짜 기본값', content: '오늘 작성' });

    expect(res.status).toBe(201);
    expect(res.body.diaryDate).toBe(today);
  });

  it('과거 날짜를 diaryDate로 지정하면 그대로 저장된다(어제 못 쓴 일기)', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '어제 일기', content: '어제 못 쓴 일기', diaryDate: yesterday });

    expect(res.status).toBe(201);
    expect(res.body.diaryDate).toBe(yesterday);
  });

  it('잘못된 형식의 diaryDate는 400을 반환한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: 't', content: 'c', diaryDate: '2026/07/05' });

    expect(res.status).toBe(400);
  });

  it('목록 조회는 diaryDate 최신순으로 정렬된다(작성 순서와 무관)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const oldDate = '2020-01-01';

    const olderWrittenLaterRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '정렬 테스트 - 옛날 일기', content: 'c', diaryDate: oldDate });

    const res = await request(app)
      .get('/api/v1/diaries?limit=100')
      .set('Authorization', `Bearer ${ownerAccessToken}`);

    const oldIndex = res.body.items.findIndex((d) => d.id === olderWrittenLaterRes.body.id);
    const todayIndex = res.body.items.findIndex((d) => d.diaryDate === today);

    expect(oldIndex).toBeGreaterThan(-1);
    expect(todayIndex).toBeGreaterThan(-1);
    expect(todayIndex).toBeLessThan(oldIndex);
  });

  it('수정 시 diaryDate를 변경할 수 있다', async () => {
    const createRes = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '수정 전', content: 'c' });

    const newDate = '2026-01-15';
    const updateRes = await request(app)
      .put(`/api/v1/diaries/${createRes.body.id}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '수정 후', content: 'c', diaryDate: newDate });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.diaryDate).toBe(newDate);
  });
});

describe('GET /api/v1/diaries (BE-13, BE-14)', () => {
  it('본인 일기만 최신순으로 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20 });
  });

  it('결과 없음 시 200 + 빈 배열을 반환한다(타 사용자)', async () => {
    const res = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('weather/mood/tag 복합 필터가 반영된다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=rainy&mood=sad&tag=일상')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.some((d) => d.id === createdDiaryId)).toBe(true);
  });

  it('일치하지 않는 필터는 빈 결과를 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=sunny')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('정의되지 않은 ENUM 파라미터 시 400을 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries?weather=invalid')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/diaries/:id (BE-15)', () => {
  it('본인 소유 일기의 상세를 200으로 반환한다', async () => {
    const res = await request(app)
      .get(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdDiaryId);
  });

  it('타인 소유 일기는 403을 반환한다', async () => {
    const res = await request(app)
      .get(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(res.status).toBe(403);
  });

  it('미존재 일기는 404를 반환한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/diaries/:id (BE-16)', () => {
  it('본인 소유 일기를 수정하고 태그가 재구성된다', async () => {
    const res = await request(app)
      .put(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: '수정된 제목', content: '수정된 본문', weather: 'cloudy', tags: ['수정됨'] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('수정된 제목');
    expect(res.body.tags).toEqual(['수정됨']);
  });

  it('타인 소유 일기 수정 시 403을 반환한다', async () => {
    const res = await request(app)
      .put(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .send({ title: 't', content: 'c' });
    expect(res.status).toBe(403);
  });

  it('미존재 일기 수정 시 404를 반환한다', async () => {
    const res = await request(app)
      .put('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ title: 't', content: 'c' });
    expect(res.status).toBe(404);
  });

  it('검증 실패(제목 누락) 시 400을 반환한다', async () => {
    const res = await request(app)
      .put(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`)
      .send({ content: 'c' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/diaries/:id (BE-17)', () => {
  it('타인 소유 일기 삭제 시 403을 반환한다', async () => {
    const res = await request(app)
      .delete(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`);
    expect(res.status).toBe(403);
  });

  it('미존재 일기 삭제 시 404를 반환한다', async () => {
    const res = await request(app)
      .delete('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(404);
  });

  it('본인 소유 일기를 삭제하면 204를 반환하고 diary_tags가 함께 제거된다', async () => {
    const res = await request(app)
      .delete(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    expect(res.status).toBe(204);

    const { rows } = await pool.query('SELECT * FROM diary_tags WHERE diary_id = $1', [
      createdDiaryId,
    ]);
    expect(rows).toHaveLength(0);
  });

  it('US-B6 AC-4: 삭제 직후 목록 조회에서 즉시 제외된다', async () => {
    const listRes = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${ownerAccessToken}`);
    const detailRes = await request(app)
      .get(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${ownerAccessToken}`);

    expect(listRes.body.items.some((d) => d.id === createdDiaryId)).toBe(false);
    expect(detailRes.status).toBe(404);
  });
});
