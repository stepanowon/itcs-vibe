const { IRefreshTokenRepository } = require('../../domain/repositories/IRefreshTokenRepository');

function toRefreshToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revoked: row.revoked,
    createdAt: row.created_at,
  };
}

class PgRefreshTokenRepository extends IRefreshTokenRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async create({ userId, tokenHash, expiresAt }) {
    const { rows } = await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, tokenHash, expiresAt]
    );
    return toRefreshToken(rows[0]);
  }

  async findByTokenHash(tokenHash) {
    const { rows } = await this.pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1',
      [tokenHash]
    );
    return toRefreshToken(rows[0]);
  }

  async revokeByTokenHash(tokenHash) {
    await this.pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [
      tokenHash,
    ]);
  }

  async revokeAllByUserId(userId) {
    await this.pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [
      userId,
    ]);
  }
}

module.exports = { PgRefreshTokenRepository };
