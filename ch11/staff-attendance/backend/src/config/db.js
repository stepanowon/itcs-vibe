const { Pool, types } = require('pg');
const { DATABASE_URL } = require('./env');

// pg 기본 DATE(OID 1082) 파서는 서버 로컬 타임존으로 Date 객체를 만들어(new Date(y,m,d)),
// UTC가 아닌 환경(KST 등)에서 JSON 직렬화 시 하루가 밀리는 버그가 있다.
// DATE 컬럼(hire_date/work_date/start_date/end_date)은 시각 정보가 없으므로 문자열('YYYY-MM-DD') 그대로 반환한다.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on('error', (err) => {
  console.error('[db] 예기치 못한 커넥션 오류:', err.message);
});

module.exports = pool;
