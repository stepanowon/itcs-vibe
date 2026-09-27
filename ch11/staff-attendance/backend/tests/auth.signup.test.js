const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('SIGNUP', tag);

describe('POST /api/v1/auth/signup', () => {
  afterAll(() => pool.end());

  it('정상 가입 시 201과 함께 password 관련 필드 없는 User를 반환한다', async () => {
    const body = uniqueUser('ok');

    const res = await request(app).post('/api/v1/auth/signup').send(body);

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(body.email);
    expect(res.body.name).toBe(body.name);
    expect(res.body.employeeNo).toBe(body.employeeNo);
    expect(res.body.id).toBeDefined();
    expect(['manager', 'employee']).toContain(res.body.role);
    expect(res.body.status).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('동일 사번으로 재가입 시도 시 409와 DUPLICATE_EMPLOYEE_NO를 반환한다', async () => {
    const body = uniqueUser('dup');

    const first = await request(app).post('/api/v1/auth/signup').send(body);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/auth/signup')
      .send({ ...body, email: uniqueUser('dup2').email });

    expect(second.status).toBe(409);
    expect(second.body.code).toBe('DUPLICATE_EMPLOYEE_NO');
    expect(second.body.message).toBeDefined();
  });

  it('필수 필드(email) 누락 시 400을 반환한다', async () => {
    const body = uniqueUser('missing');
    delete body.email;

    const res = await request(app).post('/api/v1/auth/signup').send(body);

    expect(res.status).toBe(400);
  });
});
