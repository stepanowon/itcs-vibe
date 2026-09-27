const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const {
  uniqueUser: makeUniqueUser,
  signupAndLogin: doSignupAndLogin,
  promoteToManager,
} = require('./helpers/testUsers');

const uniqueUser = (tag) => makeUniqueUser('LREQ', tag);
const signupAndLogin = (tag) => doSignupAndLogin('LREQ', tag);

const setTotalDays = (email, totalDays) =>
  pool.query('UPDATE leave_balances SET total_days = $1 WHERE user_id = (SELECT id FROM users WHERE email = $2)', [
    totalDays,
    email,
  ]);

describe('연차 신청 API', () => {
  afterAll(() => pool.end());

  it('시작일이 종료일보다 늦으면 400과 INVALID_DATE_RANGE를 반환한다', async () => {
    const user = await signupAndLogin('date-range');
    await setTotalDays(user.email, 10);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-05', endDate: '2026-03-01', reason: '휴가' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DATE_RANGE');
  });

  it('잔여 연차를 초과하면 400과 INSUFFICIENT_LEAVE_BALANCE를 반환한다', async () => {
    const user = await signupAndLogin('insufficient');
    await setTotalDays(user.email, 1);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-05', reason: '휴가' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INSUFFICIENT_LEAVE_BALANCE');
  });

  it('정상 신청 시 201과 함께 status=pending인 LeaveRequest를 반환한다', async () => {
    const user = await signupAndLogin('create-ok');
    await setTotalDays(user.email, 10);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '휴가' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.requesterId).toBeDefined();
    expect(res.body.startDate).toBeDefined();
    expect(res.body.endDate).toBeDefined();
    expect(res.body.reason).toBe('휴가');
    expect(res.body.status).toBe('pending');
  });

  it('반차(halfDay=am) 신청 시 201과 함께 days=0.5, halfDay=am인 LeaveRequest를 반환한다', async () => {
    const user = await signupAndLogin('half-day-ok');
    await setTotalDays(user.email, 10);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-01', reason: '병원', halfDay: 'am' });

    expect(res.status).toBe(201);
    expect(Number(res.body.days)).toBe(0.5);
    expect(res.body.halfDay).toBe('am');
  });

  it('반차인데 시작일과 종료일이 다르면 400을 반환한다', async () => {
    const user = await signupAndLogin('half-day-range');
    await setTotalDays(user.email, 10);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '병원', halfDay: 'pm' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('halfDay 값이 am/pm이 아니면 400을 반환한다', async () => {
    const user = await signupAndLogin('half-day-invalid');
    await setTotalDays(user.email, 10);

    const res = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-01', reason: '병원', halfDay: 'evening' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('manager가 본인이 신청한 건을 본인이 승인/반려 시도하면 403과 SELF_APPROVAL_NOT_ALLOWED를 반환한다', async () => {
    const user = await signupAndLogin('self-approve');
    await setTotalDays(user.email, 10);
    const managerToken = await promoteToManager(user.email);

    const createRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '휴가' });

    const approveRes = await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(approveRes.status).toBe(403);
    expect(approveRes.body.code).toBe('SELF_APPROVAL_NOT_ALLOWED');

    const rejectRes = await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/reject`)
      .set('Authorization', `Bearer ${managerToken}`);
    expect(rejectRes.status).toBe(403);
    expect(rejectRes.body.code).toBe('SELF_APPROVAL_NOT_ALLOWED');
  });

  it('다른 manager가 승인하면 200과 함께 status=approved, processorId/processedAt이 채워지고 신청자의 used_days가 증가한다', async () => {
    const applicant = await signupAndLogin('approve-applicant');
    await setTotalDays(applicant.email, 10);

    const createRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '휴가' });

    const managerB = await signupAndLogin('approve-manager-b');
    const managerBToken = await promoteToManager(managerB.email);

    const approveRes = await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${managerBToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('approved');
    expect(approveRes.body.processorId).toBeDefined();
    expect(approveRes.body.processedAt).toBeDefined();

    const balanceRes = await pool.query('SELECT used_days FROM leave_balances WHERE user_id = $1', [
      createRes.body.requesterId,
    ]);
    expect(Number(balanceRes.rows[0].used_days)).toBe(2);
  });

  it('이미 처리된 건을 재차 승인 시도하면 409와 LEAVE_REQUEST_ALREADY_PROCESSED를 반환한다', async () => {
    const applicant = await signupAndLogin('reprocess-applicant');
    await setTotalDays(applicant.email, 10);

    const createRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${applicant.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '휴가' });

    const manager = await signupAndLogin('reprocess-manager');
    const managerToken = await promoteToManager(manager.email);

    await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    const res = await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LEAVE_REQUEST_ALREADY_PROCESSED');
  });

  it('존재하지 않는 id를 승인 시도하면 404를 반환한다', async () => {
    const manager = await signupAndLogin('not-found-manager');
    const managerToken = await promoteToManager(manager.email);

    const res = await request(app)
      .patch('/api/v1/leave-requests/00000000-0000-0000-0000-000000000000/approve')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(404);
  });

  it('employee 계정으로 전체 조회(GET /leave-requests) 시 403을 반환한다', async () => {
    const user = await signupAndLogin('list-forbidden');

    const res = await request(app)
      .get('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(403);
  });

  it('다른 manager가 반려하면 200과 함께 status=rejected가 반환된다', async () => {
    const requester = await signupAndLogin('reject-requester');
    await setTotalDays(requester.email, 10);
    const manager = await signupAndLogin('reject-manager');
    const managerToken = await promoteToManager(manager.email);

    const createRes = await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${requester.accessToken}`)
      .send({ startDate: '2026-04-01', endDate: '2026-04-01', reason: '반려테스트' });

    const rejectRes = await request(app)
      .patch(`/api/v1/leave-requests/${createRes.body.id}/reject`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.status).toBe('rejected');
    expect(rejectRes.body.processorId).toBeDefined();
  });

  it('manager가 GET /leave-requests(status 필터 포함)로 전체 조회 시 200을 반환한다', async () => {
    const manager = await signupAndLogin('list-all-manager');
    const managerToken = await promoteToManager(manager.email);

    const res = await request(app)
      .get('/api/v1/leave-requests?status=pending')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /leave-requests/me 호출 시 200과 함께 방금 신청한 건이 포함된 목록을 반환한다', async () => {
    const user = await signupAndLogin('me-ok');
    await setTotalDays(user.email, 10);

    await request(app)
      .post('/api/v1/leave-requests')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ startDate: '2026-03-01', endDate: '2026-03-02', reason: '휴가' });

    const res = await request(app)
      .get('/api/v1/leave-requests/me')
      .set('Authorization', `Bearer ${user.accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
