require('dotenv').config();

// ── 1. 환경 변수 읽기 ──────────────────────────────────────────
const DB_CONNECTION_URL = process.env.DB_CONNECTION_URL;
const TEST_API_KEY      = process.env.TEST_API_KEY;

// ── 2. 필수 환경 변수 검증 ────────────────────────────────────
const required = ['DB_CONNECTION_URL', 'TEST_API_KEY'];
const missing  = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`오류: 다음 환경 변수가 설정되지 않았습니다 → ${missing.join(', ')}`);
  process.exit(1);
}

// ── 3. 환경 변수 출력 ──────────────────────────────────────────
console.log('='.repeat(50));

console.log('[데이터베이스]');
// URL에서 비밀번호 부분 마스킹 후 출력
const maskedUrl = DB_CONNECTION_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log(`  DB_CONNECTION_URL : ${maskedUrl}`);

console.log('\n[API]');
// API 키는 앞 4자리만 출력
console.log(`  TEST_API_KEY : ${TEST_API_KEY.slice(0, 4)}****`);

console.log('='.repeat(50));
