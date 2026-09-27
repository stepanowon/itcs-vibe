const { IUserRepository } = require('../../domain/repositories/IUserRepository');

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class PgUserRepository extends IUserRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return toUser(rows[0]);
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    return toUser(rows[0]);
  }

  async findByUsername(username) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return toUser(rows[0]);
  }

  async create({ email, username, passwordHash }) {
    const { rows } = await this.pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email.toLowerCase(), username, passwordHash]
    );
    return toUser(rows[0]);
  }

  async updatePasswordHash(id, passwordHash) {
    await this.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      id,
    ]);
  }
}

module.exports = { PgUserRepository };
