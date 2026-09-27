const { pool } = require('../src/infrastructure/db/pool');
const { PgUserRepository } = require('../src/infrastructure/repositories/PgUserRepository');
const { PgTagRepository } = require('../src/infrastructure/repositories/PgTagRepository');
const { PgDiaryRepository } = require('../src/infrastructure/repositories/PgDiaryRepository');

const userRepo = new PgUserRepository(pool);
const diaryRepo = new PgDiaryRepository(pool, new PgTagRepository());

const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const testEmail = `be11-${uniqueSuffix}@example.com`;

let userId;
let diaryId;

beforeAll(async () => {
  const user = await userRepo.create({
    email: testEmail,
    username: `be11user${uniqueSuffix}`,
    passwordHash: 'hashed',
  });
  userId = user.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  await pool.end();
});

describe('PgDiaryRepository', () => {
  it('create로 일기와 태그를 생성한다(신규 태그)', async () => {
    const diary = await diaryRepo.create({
      userId,
      title: '첫 일기',
      content: '오늘의 기록',
      weather: 'sunny',
      mood: 'happy',
      tags: ['일상', '여행'],
    });

    diaryId = diary.id;

    expect(diary.userId).toBe(userId);
    expect(diary.weather).toBe('sunny');
    expect(new Set(diary.tags)).toEqual(new Set(['일상', '여행']));
  });

  it('findById로 태그를 포함한 상세를 조회한다', async () => {
    const diary = await diaryRepo.findById(diaryId);
    expect(diary.id).toBe(diaryId);
    expect(new Set(diary.tags)).toEqual(new Set(['일상', '여행']));
  });

  it('diaryDate 미지정 시 오늘 날짜가 기본 설정된다', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const diary = await diaryRepo.create({ userId, title: '기본 날짜', content: 'c' });
    expect(diary.diaryDate).toBe(today);
    await diaryRepo.deleteById(diary.id, userId);
  });

  it('diaryDate를 과거 날짜로 지정하면 그대로 저장된다', async () => {
    const diary = await diaryRepo.create({
      userId,
      title: '과거 날짜',
      content: 'c',
      diaryDate: '2020-05-01',
    });
    expect(diary.diaryDate).toBe('2020-05-01');
    await diaryRepo.deleteById(diary.id, userId);
  });

  it('존재하지 않는 id 조회 시 null을 반환한다', async () => {
    const diary = await diaryRepo.findById('00000000-0000-0000-0000-000000000000');
    expect(diary).toBeNull();
  });

  it('기존 태그는 재사용하고 목록은 최신순 + 페이지네이션을 지원한다', async () => {
    await diaryRepo.create({
      userId,
      title: '둘째 일기',
      content: '비 오는 날',
      weather: 'rainy',
      mood: 'sad',
      tags: ['일상'], // 기존 태그 재사용
    });

    const { items, total } = await diaryRepo.list({ userId, page: 1, limit: 10 });
    expect(total).toBe(2);
    expect(items[0].title).toBe('둘째 일기'); // created_at DESC

    const { rows: tagRows } = await pool.query(
      'SELECT count(*)::int AS count FROM tags WHERE user_id = $1 AND name = $2',
      [userId, '일상']
    );
    expect(tagRows[0].count).toBe(1); // 재사용되어 중복 생성되지 않음
  });

  it('weather/mood/tag 복합 필터가 반영된다', async () => {
    const { items, total } = await diaryRepo.list({
      userId,
      weather: 'rainy',
      mood: 'sad',
      tag: '일상',
      page: 1,
      limit: 10,
    });
    expect(total).toBe(1);
    expect(items[0].title).toBe('둘째 일기');
  });

  it('updateById로 필드와 태그가 갱신된다', async () => {
    const updated = await diaryRepo.updateById(diaryId, userId, {
      title: '수정된 제목',
      content: '수정된 본문',
      weather: 'cloudy',
      mood: 'neutral',
      tags: ['수정태그'],
    });

    expect(updated.title).toBe('수정된 제목');
    expect(updated.tags).toEqual(['수정태그']);
  });

  it('다른 사용자 id로 updateById 시 null을 반환한다(소유권 불일치)', async () => {
    const result = await diaryRepo.updateById(diaryId, '00000000-0000-0000-0000-000000000000', {
      title: 'x',
      content: 'y',
    });
    expect(result).toBeNull();
  });

  it('countByUserId가 작성한 일기 수를 반환한다', async () => {
    const count = await diaryRepo.countByUserId(userId);
    expect(count).toBe(2);
  });

  it('deleteById로 일기와 diary_tags 연결이 함께 삭제된다', async () => {
    const deleted = await diaryRepo.deleteById(diaryId, userId);
    expect(deleted).toBe(true);

    const { rows } = await pool.query('SELECT * FROM diary_tags WHERE diary_id = $1', [diaryId]);
    expect(rows).toHaveLength(0);
  });
});
