const pool = require('../../config/db');

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['findByUserId']} */
async function findByUserId(userId) {
  const { rows } = await pool.query('SELECT * FROM leave_balances WHERE user_id = $1', [userId]);
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['create']} */
async function create({ userId, totalDays = 0, usedDays = 0 }, client = pool) {
  try {
    const { rows } = await client.query(
      `INSERT INTO leave_balances (user_id, total_days, used_days)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, totalDays, usedDays]
    );
    console.log('[leaveBalanceRepository] 연차 잔여 생성 성공:', rows[0].user_id);
    return rows[0];
  } catch (err) {
    console.error('[leaveBalanceRepository] 연차 잔여 생성 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['incrementUsedDays']} */
async function incrementUsedDays(userId, deltaDays, client = pool) {
  try {
    const { rows } = await client.query(
      'UPDATE leave_balances SET used_days = used_days + $1 WHERE user_id = $2 RETURNING *',
      [deltaDays, userId]
    );
    console.log('[leaveBalanceRepository] 사용 일수 갱신 성공:', userId, deltaDays);
    return rows[0];
  } catch (err) {
    console.error('[leaveBalanceRepository] 사용 일수 갱신 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['listAllWithUserHireDate']} */
async function listAllWithUserHireDate(client = pool) {
  const { rows } = await client.query(
    `SELECT lb.user_id, u.hire_date, lb.total_days, lb.used_days
     FROM leave_balances lb
     JOIN users u ON u.id = lb.user_id`
  );
  return rows;
}

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['listAllWithUser']} */
async function listAllWithUser() {
  const { rows } = await pool.query(
    `SELECT lb.user_id, u.employee_no, u.name, lb.total_days, lb.used_days, lb.remaining_days
     FROM leave_balances lb
     JOIN users u ON u.id = lb.user_id
     ORDER BY u.employee_no`
  );
  return rows;
}

/** @type {import('../../domain/repositories/leaveBalanceRepository.interface').LeaveBalanceRepository['setTotalDays']} */
async function setTotalDays(userId, totalDays, client = pool) {
  const { rows } = await client.query(
    'UPDATE leave_balances SET total_days = $1 WHERE user_id = $2 RETURNING *',
    [totalDays, userId]
  );
  console.log('[leaveBalanceRepository] 총 일수 변경 성공:', userId, totalDays);
  return rows[0] || null;
}

module.exports = {
  findByUserId,
  create,
  incrementUsedDays,
  listAllWithUserHireDate,
  listAllWithUser,
  setTotalDays,
};
