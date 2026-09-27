const { ITagRepository } = require('../../domain/repositories/ITagRepository');

class PgTagRepository extends ITagRepository {
  // names의 각 태그를 사용자별로 upsert하고 tag id 목록을 반환한다(신규 생성 또는 기존 재사용).
  async upsertMany(client, userId, names = []) {
    const ids = [];
    for (const name of names) {
      const { rows } = await client.query(
        `INSERT INTO tags (user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [userId, name]
      );
      ids.push(rows[0].id);
    }
    return ids;
  }
}

module.exports = { PgTagRepository };
