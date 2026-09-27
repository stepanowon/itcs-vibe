require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DB_CONN_STRING = process.env.DB_CONN_STRING;

if (!DB_CONN_STRING) {
  throw new Error('DB_CONN_STRING 환경변수가 설정되지 않았습니다.');
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET 환경변수가 설정되지 않았습니다.');
}

if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET 환경변수가 설정되지 않았습니다.');
}

const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS) || 43200;
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS) || 604800;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

module.exports = {
  PORT,
  DB_CONN_STRING,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  CORS_ORIGIN,
};
