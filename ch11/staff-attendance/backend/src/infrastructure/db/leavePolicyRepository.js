const pool = require('../../config/db');

/** @type {import('../../domain/repositories/leavePolicyRepository.interface').LeavePolicyRepository['get']} */
async function get() {
  const { rows } = await pool.query('SELECT * FROM leave_policy WHERE id = 1');
  return rows[0];
}

/** @type {import('../../domain/repositories/leavePolicyRepository.interface').LeavePolicyRepository['setBaseDays']} */
async function setBaseDays(baseDays, client = pool) {
  const { rows } = await client.query(
    'UPDATE leave_policy SET base_days = $1 WHERE id = 1 RETURNING *',
    [baseDays]
  );
  console.log('[leavePolicyRepository] 공통 연차일수 변경 성공:', baseDays);
  return rows[0];
}

module.exports = { get, setBaseDays };
