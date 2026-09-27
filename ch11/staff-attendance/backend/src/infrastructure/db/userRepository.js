const pool = require('../../config/db');

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['findByEmail']} */
async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['findByEmployeeNo']} */
async function findByEmployeeNo(employeeNo) {
  const { rows } = await pool.query('SELECT * FROM users WHERE employee_no = $1', [employeeNo]);
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['findById']} */
async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['findAll']} */
async function findAll() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return rows;
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['countManagers']} */
async function countManagers() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'manager'");
  return rows[0].cnt;
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['create']} */
async function create({ email, name, employeeNo, hireDate, passwordHash, role }, client = pool) {
  try {
    const { rows } = await client.query(
      `INSERT INTO users (email, name, employee_no, hire_date, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, name, employeeNo, hireDate, passwordHash, role]
    );
    console.log('[userRepository] 사용자 생성 성공:', rows[0].id);
    return rows[0];
  } catch (err) {
    console.error('[userRepository] 사용자 생성 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['updatePassword']} */
async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  console.log('[userRepository] 비밀번호 변경 성공:', id);
}

/** @type {import('../../domain/repositories/userRepository.interface').UserRepository['createWithInitialManagerCheck']} */
async function createWithInitialManagerCheck({ email, name, employeeNo, hireDate, passwordHash, initialTotalDays = 0 }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('users_manager_signup'));");

    const { rows: countRows } = await client.query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'manager'");
    const role = countRows[0].cnt === 0 ? 'manager' : 'employee';
    console.log(`[userRepository] 최초가입 여부 판단: role=${role}`);

    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, name, employee_no, hire_date, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, name, employeeNo, hireDate, passwordHash, role]
    );
    const user = userRows[0];

    await client.query(
      'INSERT INTO leave_balances (user_id, total_days, used_days) VALUES ($1, $2, 0)',
      [user.id, initialTotalDays]
    );

    await client.query('COMMIT');
    console.log('[userRepository] 회원가입 트랜잭션 성공:', user.id, role);
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[userRepository] 회원가입 트랜잭션 실패:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findByEmail,
  findByEmployeeNo,
  findById,
  findAll,
  countManagers,
  create,
  updatePassword,
  createWithInitialManagerCheck,
};
