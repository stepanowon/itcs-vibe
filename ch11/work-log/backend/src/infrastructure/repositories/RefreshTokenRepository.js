const pool = require('../db/pool');

async function create({ userId, tokenHash, expiresAt }) {
  const { rows } = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token_hash, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  );
  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function findValidByHash(tokenHash) {
  const { rows } = await pool.query(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE token_hash=$1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
}

async function revokeByHash(tokenHash) {
  const { rows } = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING id`,
    [tokenHash]
  );
  return rows[0] || null;
}

module.exports = { create, findValidByHash, revokeByHash };
