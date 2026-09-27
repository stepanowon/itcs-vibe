const { Pool, types } = require('pg');
const { config } = require('../config/env');

// DATE(OID 1082) 컬럼을 로컬 타임존 Date 객체로 변환하지 않고 'YYYY-MM-DD' 원문 그대로 반환한다.
// (기본 동작은 로컬 자정 Date로 파싱되어 UTC 변환 시 하루가 밀리는 문제가 있음)
types.setTypeParser(1082, (value) => value);

// Supabase PostgreSQL 커넥션 풀 (앱 전역에서 재사용)
const pool = new Pool({ connectionString: config.dbConnString });

// 연결 상태 확인용 헬스체크 쿼리
async function checkConnection() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0].ok === 1;
}

// 트랜잭션 실행 헬퍼: callback 내에서 client로 쿼리를 수행하고 성공 시 COMMIT, 실패 시 ROLLBACK
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, checkConnection, withTransaction };
