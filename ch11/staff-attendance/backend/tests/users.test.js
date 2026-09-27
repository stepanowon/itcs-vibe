const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const {
  uniqueUser: makeUniqueUser,
  signupAndLogin: doSignupAndLogin,
  promoteToManager,
} = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('USERS', tag);
const signupAndLogin = (tag) => doSignupAndLogin('USERS', tag);

const login = (email, password) =>
  request(app).post('/api/v1/auth/login').send({ email, password });

const signupAndLoginAsManager = async (tag) => {
  const user = await signupAndLogin(tag);
  const accessToken = await promoteToManager(user.email);
  return { ...user, accessToken };
};

afterAll(() => pool.end());

describe('GET /api/v1/users/me', () => {

  it('로그인한 사용자 본인 정보를 반환하며 password 관련 필드가 없다', async () => {
    const user = await signupAndLogin('me-ok');

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body.name).toBe(user.name);
    expect(res.body.employeeNo).toBe(user.employeeNo);
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe('PATCH /api/v1/users/me/password', () => {

  it('현재 비밀번호가 틀리면 400과 INVALID_CURRENT_PASSWORD를 반환하고 비밀번호는 변경되지 않는다', async () => {
    const user = await signupAndLogin('pw-wrong');

    const res = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ currentPassword: 'wrong-password', newPassword: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');

    const withNewPassword = await login(user.email, 'newpassword123');
    expect(withNewPassword.status).toBe(401);

    const withOldPassword = await login(user.email, user.password);
    expect(withOldPassword.status).toBe(200);
  });

  it('현재 비밀번호가 맞으면 200과 새 토큰을 반환하고 새 토큰으로 내 정보 조회가 가능하다', async () => {
    const user = await signupAndLogin('pw-ok');

    const res = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ currentPassword: user.password, newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.expiresIn).toBeDefined();

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${res.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(user.email);
  });
});

describe('POST /api/v1/users', () => {

  it('employee 계정으로 접근 시 403을 반환한다', async () => {
    const employee = await signupAndLogin('create-forbidden');
    const newManager = uniqueUser('create-forbidden-target');

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send(newManager);

    expect(res.status).toBe(403);
  });

  it('manager 계정으로 생성 시 201과 함께 role=manager인 User를 반환한다', async () => {
    const manager = await signupAndLoginAsManager('create-ok');
    const newManager = uniqueUser('create-ok-target');

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send(newManager);

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(newManager.email);
    expect(res.body.employeeNo).toBe(newManager.employeeNo);
    expect(res.body.role).toBe('manager');
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('동일 사번으로 생성 시도 시 409를 반환한다', async () => {
    const manager = await signupAndLoginAsManager('create-dup');
    const newManager = uniqueUser('create-dup-target');

    const first = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send(newManager);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({ ...newManager, email: uniqueUser('create-dup-target2').email });

    expect(second.status).toBe(409);
  });
});

describe('GET /api/v1/users', () => {

  it('employee 계정으로 접근 시 403을 반환한다', async () => {
    const employee = await signupAndLogin('list-forbidden');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${employee.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('manager 계정으로 접근 시 200과 User 배열을 반환한다', async () => {
    const manager = await signupAndLoginAsManager('list-ok');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${manager.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u) => u.email === manager.email)).toBe(true);
  });
});
