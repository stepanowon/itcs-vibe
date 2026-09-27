const pool = require('../../config/db');

/** @type {import('../../domain/repositories/healthRepository.interface').HealthRepository['checkDbConnection']} */
async function checkDbConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('[db] 연결 성공');
  } catch (err) {
    console.error('[db] 연결 실패:', err.message);
    throw err;
  }
}

module.exports = { checkDbConnection };
