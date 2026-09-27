const pool = require('../db/pool');

async function create({ userId, logDate, title, content, issueSolution, isCompleted, tomorrowPlan }) {
  const { rows } = await pool.query(
    `INSERT INTO work_logs (
       user_id, log_date, title, content, issue_solution, is_completed, tomorrow_plan
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, log_date, title, content, issue_solution, is_completed, tomorrow_plan,
       created_at, updated_at`,
    [userId, logDate, title, content, issueSolution ?? null, isCompleted, tomorrowPlan ?? null]
  );
  const row = rows[0];
  return {
    id: row.id,
    logDate: row.log_date,
    title: row.title,
    content: row.content,
    issueSolution: row.issue_solution,
    isCompleted: row.is_completed,
    tomorrowPlan: row.tomorrow_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findMany({ userId, isCompleted, page, limit }) {
  const offset = (page - 1) * limit;
  const { rows } = await pool.query(
    `SELECT id, log_date, title, content, issue_solution, is_completed, tomorrow_plan,
       created_at, updated_at, COUNT(*) OVER() AS total_count
     FROM work_logs
     WHERE user_id = $1
       AND is_deleted = false
       AND ($2::boolean IS NULL OR is_completed = $2)
     ORDER BY log_date DESC, created_at DESC
     LIMIT $3 OFFSET $4`,
    [userId, isCompleted ?? null, limit, offset]
  );
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const items = rows.map((row) => ({
    id: row.id,
    logDate: row.log_date,
    title: row.title,
    content: row.content,
    issueSolution: row.issue_solution,
    isCompleted: row.is_completed,
    tomorrowPlan: row.tomorrow_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return { items, total };
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, log_date, title, content, issue_solution, is_completed, tomorrow_plan,
       created_at, updated_at
     FROM work_logs
     WHERE id = $1 AND is_deleted = false`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    title: row.title,
    content: row.content,
    issueSolution: row.issue_solution,
    isCompleted: row.is_completed,
    tomorrowPlan: row.tomorrow_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function update(id, fields) {
  const columns = {
    logDate: 'log_date',
    title: 'title',
    content: 'content',
    issueSolution: 'issue_solution',
    isCompleted: 'is_completed',
    tomorrowPlan: 'tomorrow_plan',
  };
  const sets = [];
  const values = [];
  let idx = 1;
  for (const [key, col] of Object.entries(columns)) {
    if (fields[key] !== undefined) {
      sets.push(`${col} = $${idx++}`);
      values.push(fields[key]);
    }
  }
  sets.push('updated_at = now()');
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE work_logs SET ${sets.join(', ')} WHERE id = $${idx} AND is_deleted = false
     RETURNING id, log_date, title, content, issue_solution, is_completed, tomorrow_plan,
       created_at, updated_at`,
    values
  );
  const row = rows[0];
  return {
    id: row.id,
    logDate: row.log_date,
    title: row.title,
    content: row.content,
    issueSolution: row.issue_solution,
    isCompleted: row.is_completed,
    tomorrowPlan: row.tomorrow_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function softDelete(id) {
  await pool.query(
    `UPDATE work_logs SET is_deleted = true, updated_at = now() WHERE id = $1 AND is_deleted = false`,
    [id]
  );
}

async function countByUserId(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) FROM work_logs WHERE user_id=$1 AND is_deleted=false',
    [userId]
  );
  return Number(rows[0].count);
}

module.exports = { create, findMany, findById, update, softDelete, countByUserId };
