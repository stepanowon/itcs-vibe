const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

const DEFAULT_PASSWORD = 'password123';

/** 사번/이메일에 접두사(prefix)를 붙여 매 테스트마다 고유한 사용자 정보를 생성한다. */
function uniqueUser(prefix, tag) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    email: `test-${prefix.toLowerCase()}-${tag}-${suffix}@test.com`,
    name: '테스트사용자',
    employeeNo: `${prefix}-${suffix}`,
    hireDate: '2026-01-02',
    password: DEFAULT_PASSWORD,
  };
}

/** 회원가입 후 로그인해 accessToken을 포함한 사용자 정보를 반환한다. */
async function signupAndLogin(prefix, tag) {
  const body = uniqueUser(prefix, tag);
  await request(app).post('/api/v1/auth/signup').send(body);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: body.email, password: body.password });
  return { ...body, accessToken: res.body.accessToken };
}

/** DB에서 직접 role을 manager로 승격한다(재로그인 없이, 반환값 없음). */
function setManagerRole(email) {
  return pool.query("UPDATE users SET role = 'manager' WHERE email = $1", [email]);
}

/** role을 manager로 승격한 뒤 재로그인해 새 accessToken을 반환한다. */
async function promoteToManager(email) {
  await setManagerRole(email);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: DEFAULT_PASSWORD });
  return res.body.accessToken;
}

module.exports = { uniqueUser, signupAndLogin, setManagerRole, promoteToManager };
