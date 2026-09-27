const env = require('./infrastructure/config/env');
const pool = require('./infrastructure/db/pool');
const app = require('./interfaces/http/app');

async function start() {
  try {
    await pool.testConnection();
  } catch (err) {
    console.error('DB 연결 실패:', err.message);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`서버가 ${env.PORT} 포트에서 실행 중입니다.`);
  });
}

start();
