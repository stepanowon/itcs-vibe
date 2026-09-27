const pool = require('../db/pool');

async function findConflict({ email }) {
  const { rows } = await pool.query('SELECT id, email FROM users WHERE email=$1', [email]);
  return rows[0] || null;
}

async function create({ userCode, email, passwordHash, name, department }) {
  const { rows } = await pool.query(
    `INSERT INTO users (user_code, email, password_hash, name, department)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_code, email, name, department, created_at`,
    [userCode, email, passwordHash, name, department]
  );
  const row = rows[0];
  return {
    id: row.id,
    userCode: row.user_code,
    email: row.email,
    name: row.name,
    department: row.department,
    createdAt: row.created_at,
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, user_code, email, password_hash, name, department FROM users WHERE email=$1',
    [email]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userCode: row.user_code,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    department: row.department,
  };
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, user_code, email, password_hash, name, department, created_at FROM users WHERE id=$1',
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userCode: row.user_code,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    department: row.department,
    createdAt: row.created_at,
  };
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, id]);
}

module.exports = { findConflict, create, findByEmail, findById, updatePassword };
