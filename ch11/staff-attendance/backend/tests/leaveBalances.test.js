const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser, signupAndLogin: doSignupAndLogin } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('LBAL', tag);
const signupAndLogin = (tag) => doSignupAndLogin('LBAL', tag);

describe('연차 잔여일수 API', () => {
  afterAll(() => pool.end());

  it('GET /leave-balances/me 호출 시 200과 함께 totalDays/usedDays/remainingDays 필드를 반환한다', async () => {
    const user = await signupAndLogin('me-ok');

    const res = await request(app)
      .get('/api/v1/leave-balances/me')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBeDefined();
    expect(res.body.totalDays).toBeDefined();
    expect(res.body.usedDays).toBeDefined();
    expect(res.body.remainingDays).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });
});
