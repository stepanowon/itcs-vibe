const pool = require('../../config/db');

const SELECT_WITH_NAMES = `
  SELECT lr.*, u1.name AS requester_name, u2.name AS processor_name
  FROM leave_requests lr
  JOIN users u1 ON u1.id = lr.requester_id
  LEFT JOIN users u2 ON u2.id = lr.processor_id
`;

/** @type {import('../../domain/repositories/leaveRequestRepository.interface').LeaveRequestRepository['create']} */
async function create({ requesterId, startDate, endDate, days, reason, halfDay = null }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO leave_requests (requester_id, start_date, end_date, days, reason, half_day)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [requesterId, startDate, endDate, days, reason, halfDay]
    );
    console.log('[leaveRequestRepository] 연차 신청 생성 성공:', rows[0].id);
    return rows[0];
  } catch (err) {
    console.error('[leaveRequestRepository] 연차 신청 생성 실패:', err.message);
    throw err;
  }
}

/** @type {import('../../domain/repositories/leaveRequestRepository.interface').LeaveRequestRepository['findById']} */
async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM leave_requests WHERE id = $1', [id]);
  return rows[0] || null;
}

/** @type {import('../../domain/repositories/leaveRequestRepository.interface').LeaveRequestRepository['listByRequesterId']} */
async function listByRequesterId(requesterId, month = null) {
  if (month) {
    const { rows } = await pool.query(
      `${SELECT_WITH_NAMES}
       WHERE lr.requester_id = $1
         AND (to_char(lr.start_date, 'YYYY-MM') = $2 OR to_char(lr.end_date, 'YYYY-MM') = $2)
       ORDER BY lr.created_at DESC`,
      [requesterId, month]
    );
    return rows;
  }
  const { rows } = await pool.query(
    `${SELECT_WITH_NAMES}
     WHERE lr.requester_id = $1
     ORDER BY lr.created_at DESC`,
    [requesterId]
  );
  return rows;
}

/** @type {import('../../domain/repositories/leaveRequestRepository.interface').LeaveRequestRepository['listAll']} */
async function listAll({ status = null, month = null, userId = null } = {}) {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`lr.status = $${params.length}`);
  }
  if (month) {
    params.push(month);
    conditions.push(
      `(to_char(lr.start_date, 'YYYY-MM') = $${params.length} OR to_char(lr.end_date, 'YYYY-MM') = $${params.length})`
    );
  }
  if (userId) {
    params.push(userId);
    conditions.push(`lr.requester_id = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `${SELECT_WITH_NAMES} ${whereClause} ORDER BY lr.created_at DESC`,
    params
  );
  return rows;
}

/** @type {import('../../domain/repositories/leaveRequestRepository.interface').LeaveRequestRepository['updateStatusIfPending']} */
async function updateStatusIfPending(id, { status, processorId, processedAt }, client = pool) {
  const { rows, rowCount } = await client.query(
    `UPDATE leave_requests
     SET status = $1, processor_id = $2, processed_at = $3
     WHERE id = $4 AND status = 'pending'
     RETURNING *`,
    [status, processorId, processedAt, id]
  );
  if (rowCount === 0) {
    console.log('[leaveRequestRepository] 상태 변경 실패(이미 처리됨 또는 존재하지 않음):', id);
    return null;
  }
  console.log('[leaveRequestRepository] 상태 변경 성공:', id, status);
  return rows[0];
}

module.exports = {
  create,
  findById,
  listByRequesterId,
  listAll,
  updateStatusIfPending,
};
