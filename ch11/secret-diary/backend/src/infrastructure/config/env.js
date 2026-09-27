const path = require('path');
const dotenv = require('dotenv');

// backend/.env 를 로딩한다. (파일 위치: backend/src/infrastructure/config → backend/.env)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12시간
const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7일

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  dbConnString: process.env.DB_CONN_STRING,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtlSeconds: Number.parseInt(
    process.env.ACCESS_TOKEN_TTL_SECONDS ?? String(DEFAULT_ACCESS_TOKEN_TTL_SECONDS),
    10
  ),
  refreshTokenTtlSeconds: Number.parseInt(
    process.env.REFRESH_TOKEN_TTL_SECONDS ?? String(DEFAULT_REFRESH_TOKEN_TTL_SECONDS),
    10
  ),
  corsOrigins: (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

if (!config.dbConnString) {
  throw new Error('환경 변수 DB_CONN_STRING 가(이) 설정되지 않았습니다.');
}

if (!config.jwtAccessSecret) {
  throw new Error('환경 변수 JWT_ACCESS_SECRET 가(이) 설정되지 않았습니다.');
}

if (!config.jwtRefreshSecret) {
  throw new Error('환경 변수 JWT_REFRESH_SECRET 가(이) 설정되지 않았습니다.');
}

if (config.corsOrigins.length === 0) {
  throw new Error('환경 변수 CORS_ORIGIN 가(이) 설정되지 않았습니다.');
}

module.exports = { config };
