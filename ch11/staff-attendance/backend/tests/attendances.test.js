const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { uniqueUser: makeUniqueUser, signupAndLogin: doSignupAndLogin, setManagerRole } = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('ATTND', tag);
const signupAndLogin = (tag) => doSignupAndLogin('ATTND', tag);
const promoteToManager = (email) => setManagerRole(email);

const currentMonth = () => new Date().toISOString().slice(0, 7);

describe('출퇴근 API', () => {
  afterAll(() => pool.end());

  it('당일 최초 체크인 시 201과 함께 checkInAt이 채워진 Attendance를 반환한다', async () => {
    const user = await signupAndLogin('checkin-ok');

    const res = await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.userId).toBeDefined();
    expect(res.body.workDate).toBeDefined();
    expect(res.body.checkInAt).toBeDefined();
    expect(res.body.checkOutAt).toBeNull();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('당일 재차 체크인 시도 시 409와 ALREADY_CHECKED_IN을 반환한다', async () => {
    const user = await signupAndLogin('checkin-dup');

    await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    const res = await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ALREADY_CHECKED_IN');
  });

  it('체크인 없이 체크아웃 시도 시 400과 CHECK_IN_NOT_FOUND를 반환한다', async () => {
    const user = await signupAndLogin('checkout-no-checkin');

    const res = await request(app)
      .post('/api/v1/attendances/check-out')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CHECK_IN_NOT_FOUND');
  });

  it('체크인 후 체크아웃 시 200과 함께 checkOutAt이 채워진 Attendance를 반환한다', async () => {
    const user = await signupAndLogin('checkout-ok');

    await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    const res = await request(app)
      .post('/api/v1/attendances/check-out')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.checkInAt).toBeDefined();
    expect(res.body.checkOutAt).toBeDefined();
  });

  it('체크아웃을 여러 번 클릭하면 최종 클릭 시각으로 checkOutAt이 갱신된다', async () => {
    const user = await signupAndLogin('checkout-repeat');

    await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    const first = await request(app)
      .post('/api/v1/attendances/check-out')
      .set('Authorization', `Bearer ${user.accessToken}`);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const second = await request(app)
      .post('/api/v1/attendances/check-out')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);
    expect(new Date(second.body.checkOutAt).getTime()).toBeGreaterThan(
      new Date(first.body.checkOutAt).getTime(),
    );
  });

  it('employee 계정으로 전체 조회(GET /attendances) 시 403을 반환한다', async () => {
    const user = await signupAndLogin('list-forbidden');

    const res = await request(app)
      .get('/api/v1/attendances')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .query({ month: currentMonth() });

    expect(res.status).toBe(403);
  });

  it('manager 계정으로 전체 조회(GET /attendances) 시 200과 목록을 반환한다', async () => {
    const user = await signupAndLogin('list-manager');
    await promoteToManager(user.email);
    const managerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    const res = await request(app)
      .get('/api/v1/attendances')
      .set('Authorization', `Bearer ${managerLogin.body.accessToken}`)
      .query({ month: currentMonth() });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /attendances/me?month=YYYY-MM 호출 시 방금 체크인한 기록이 포함된다', async () => {
    const user = await signupAndLogin('me-ok');

    await request(app)
      .post('/api/v1/attendances/check-in')
      .set('Authorization', `Bearer ${user.accessToken}`);

    const res = await request(app)
      .get('/api/v1/attendances/me')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .query({ month: currentMonth() });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.some((a) => a.checkInAt)).toBe(true);
  });

  it('시나리오 예외C: 23:30에 체크인 후 자정을 넘겨 01:00에 체크아웃해도 같은 workDate에 귀속된다', async () => {
    const user = await signupAndLogin('midnight');

    // 로그인(토큰 발급)은 실제 현재 시각 기준이므로, 자정을 넘기는 두 시점을
    // "실제 오늘 KST 23:30" -> "실제 내일 KST 01:00"으로 잡아야 토큰 만료(12h)에 걸리지 않는다.
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayKst = nowKst.toISOString().slice(0, 10);
    const tomorrowKst = new Date(nowKst.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const beforeMidnight = new Date(`${todayKst}T23:30:00+09:00`);
    const afterMidnight = new Date(`${tomorrowKst}T01:00:00+09:00`);

    // checkIn/checkOutUsecase가 Date.now() 기준 KST로 workDate를 계산하므로, 시스템 시각만 가짜로 바꾼다.
    // 타이머(setTimeout 등)는 실제로 두어야 supertest의 HTTP 요청이 정상 동작한다.
    jest.useFakeTimers({
      doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask'],
    });
    try {
      jest.setSystemTime(beforeMidnight);
      const checkInRes = await request(app)
        .post('/api/v1/attendances/check-in')
        .set('Authorization', `Bearer ${user.accessToken}`);
      expect(checkInRes.status).toBe(201);
      expect(checkInRes.body.workDate).toBe(todayKst);

      jest.setSystemTime(afterMidnight);
      const checkOutRes = await request(app)
        .post('/api/v1/attendances/check-out')
        .set('Authorization', `Bearer ${user.accessToken}`);

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.id).toBe(checkInRes.body.id);
      expect(checkOutRes.body.workDate).toBe(todayKst); // 체크아웃은 다음날이어도 workDate는 체크인일 그대로
      expect(new Date(checkOutRes.body.checkOutAt).getTime()).toBe(afterMidnight.getTime());
    } finally {
      jest.useRealTimers();
    }
  });
});
