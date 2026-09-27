const pool = require('../../config/db');

/** @type {import('../../domain/repositories/attendanceRepository.interface').AttendanceRepository['findByUserIdAndWorkDate']} */
async function findByUserIdAndWorkDate(userId, workDate) {
  const { rows } = await pool.query(
    'SELECT * FROM attendances WHERE user_id = $1 AND work_date = $2',
    [userId, workDate]
  );
  return rows[0] || null;
}

/** 가장 최근 근무일 기록을 찾는다(체크아웃 여부 무관).
 *  자정을 넘겨 체크아웃하는 경우(work_date != 오늘) 대응 및
 *  체크아웃 재클릭(최종 클릭 시각으로 갱신) 대응용. */
async function findLatestByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM attendances WHERE user_id = $1 ORDER BY work_date DESC LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/attendanceRepository.interface').AttendanceRepository['create']} */
async function create({ userId, workDate, checkInAt }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO attendances (user_id, work_date, check_in_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, workDate, checkInAt]
    );
    console.log('[attendanceRepository] 출근 등록 성공:', rows[0].id);
    return rows[0];
  } catch (err) {
    console.error('[attendanceRepository] 출근 등록 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/attendanceRepository.interface').AttendanceRepository['updateCheckOut']} */
async function updateCheckOut(id, checkOutAt) {
  try {
    const { rows } = await pool.query(
      'UPDATE attendances SET check_out_at = $1 WHERE id = $2 RETURNING *',
      [checkOutAt, id]
    );
    console.log('[attendanceRepository] 퇴근 등록 성공:', id);
    return rows[0];
  } catch (err) {
    console.error('[attendanceRepository] 퇴근 등록 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/attendanceRepository.interface').AttendanceRepository['listByUserIdAndMonth']} */
async function listByUserIdAndMonth(userId, yyyyMm) {
  const { rows } = await pool.query(
    `SELECT * FROM attendances
     WHERE user_id = $1 AND to_char(work_date, 'YYYY-MM') = $2
     ORDER BY work_date ASC`,
    [userId, yyyyMm]
  );
  return rows;
}

/** @type {import('../../domain/repositories/attendanceRepository.interface').AttendanceRepository['listByMonth']} */
async function listByMonth(yyyyMm, userId = null) {
  if (userId) {
    const { rows } = await pool.query(
      `SELECT * FROM attendances
       WHERE user_id = $1 AND to_char(work_date, 'YYYY-MM') = $2
       ORDER BY work_date ASC`,
      [userId, yyyyMm]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT * FROM attendances
     WHERE to_char(work_date, 'YYYY-MM') = $1
     ORDER BY work_date ASC`,
    [yyyyMm]
  );
  return rows;
}

module.exports = {
  findByUserIdAndWorkDate,
  findLatestByUserId,
  create,
  updateCheckOut,
  listByUserIdAndMonth,
  listByMonth,
};
