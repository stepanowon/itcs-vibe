const { IDiaryRepository } = require('../../domain/repositories/IDiaryRepository');
const { withTransaction } = require('../db/pool');

const SELECT_WITH_TAGS = `
  SELECT d.*,
         COALESCE(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
  FROM diaries d
  LEFT JOIN diary_tags dt ON dt.diary_id = d.id
  LEFT JOIN tags t ON t.id = dt.tag_id
`;

function toDateOnlyString(value) {
  if (!value) return value;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function toDiary(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    weather: row.weather,
    mood: row.mood,
    tags: row.tags ?? [],
    diaryDate: toDateOnlyString(row.diary_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 필터 조건(WHERE 절)을 구성한다. 태그 필터는 EXISTS 서브쿼리로 반영한다.
function buildFilter({ userId, weather, mood, tag }, paramsStart = 1) {
  const params = [userId];
  const clauses = ['d.user_id = $1'];
  let idx = paramsStart;

  if (weather) {
    idx += 1;
    params.push(weather);
    clauses.push(`d.weather = $${idx}`);
  }
  if (mood) {
    idx += 1;
    params.push(mood);
    clauses.push(`d.mood = $${idx}`);
  }
  if (tag) {
    idx += 1;
    params.push(tag);
    clauses.push(`EXISTS (
      SELECT 1 FROM diary_tags dt2
      JOIN tags t2 ON t2.id = dt2.tag_id
      WHERE dt2.diary_id = d.id AND t2.user_id = d.user_id AND t2.name = $${idx}
    )`);
  }

  return { whereClause: clauses.join(' AND '), params };
}

class PgDiaryRepository extends IDiaryRepository {
  constructor(pool, tagRepository) {
    super();
    this.pool = pool;
    this.tagRepository = tagRepository;
  }

  async create({ userId, title, content, weather, mood, diaryDate, tags = [] }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO diaries (user_id, title, content, weather, mood, diary_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, title, content, weather ?? null, mood ?? null, diaryDate ?? todayDateString()]
      );
      const diary = rows[0];

      const tagIds = await this.tagRepository.upsertMany(client, userId, tags);
      for (const tagId of tagIds) {
        await client.query('INSERT INTO diary_tags (diary_id, tag_id) VALUES ($1, $2)', [
          diary.id,
          tagId,
        ]);
      }

      return toDiary({ ...diary, tags });
    });
  }

  async findById(id) {
    const { rows } = await this.pool.query(`${SELECT_WITH_TAGS} WHERE d.id = $1 GROUP BY d.id`, [
      id,
    ]);
    return toDiary(rows[0]);
  }

  async list({ userId, weather, mood, tag, page, limit }) {
    const { whereClause, params } = buildFilter({ userId, weather, mood, tag });
    const offset = (page - 1) * limit;

    const listParams = [...params, limit, offset];
    const { rows } = await this.pool.query(
      `${SELECT_WITH_TAGS}
       WHERE ${whereClause}
       GROUP BY d.id
       ORDER BY d.diary_date DESC, d.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      listParams
    );

    const { rows: countRows } = await this.pool.query(
      `SELECT count(*)::int AS total FROM diaries d WHERE ${whereClause}`,
      params
    );

    return { items: rows.map(toDiary), total: countRows[0].total };
  }

  async updateById(id, userId, { title, content, weather, mood, diaryDate, tags }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE diaries
         SET title = $1, content = $2, weather = $3, mood = $4, diary_date = COALESCE($5, diary_date)
         WHERE id = $6 AND user_id = $7
         RETURNING id`,
        [title, content, weather ?? null, mood ?? null, diaryDate ?? null, id, userId]
      );

      if (rows.length === 0) return null;

      if (tags !== undefined) {
        await client.query('DELETE FROM diary_tags WHERE diary_id = $1', [id]);
        const tagIds = await this.tagRepository.upsertMany(client, userId, tags);
        for (const tagId of tagIds) {
          await client.query('INSERT INTO diary_tags (diary_id, tag_id) VALUES ($1, $2)', [
            id,
            tagId,
          ]);
        }
      }

      const { rows: diaryRows } = await client.query(
        `${SELECT_WITH_TAGS} WHERE d.id = $1 GROUP BY d.id`,
        [id]
      );
      return toDiary(diaryRows[0]);
    });
  }

  async deleteById(id, userId) {
    const { rows } = await this.pool.query(
      'DELETE FROM diaries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return rows.length > 0;
  }

  async countByUserId(userId) {
    const { rows } = await this.pool.query(
      'SELECT count(*)::int AS total FROM diaries WHERE user_id = $1',
      [userId]
    );
    return rows[0].total;
  }
}

module.exports = { PgDiaryRepository };
