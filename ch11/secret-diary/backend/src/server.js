const { config } = require('./infrastructure/config/env');
const { logger } = require('./infrastructure/logging/logger');
const { checkConnection, pool } = require('./infrastructure/db/pool');
const { createApp } = require('./interfaces/http/app');

const app = createApp();

async function start() {
  await checkConnection();
  logger.info('DB 커넥션 풀 연결 확인 완료 (SELECT 1)');

  const server = app.listen(config.port, () => {
    logger.info(`서버가 포트 ${config.port} 에서 기동되었습니다. (env: ${config.nodeEnv})`);
    logger.info(`Swagger UI: http://localhost:${config.port}/api-docs`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error(`서버 기동 실패: ${err.message}`);
  process.exit(1);
});
