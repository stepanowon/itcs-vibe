const pool = require('../../src/config/db');
const userRepository = require('../../src/infrastructure/db/userRepository');
const attendanceRepository = require('../../src/infrastructure/db/attendanceRepository');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

function uniqueEmployeeNo() {
  return `TEST-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

describe('attendanceRepository', () => {
  afterAll(() => pool.end());

  async function createTestUser() {
    return userRepository.create({
      email: uniqueEmail(),
      name: '출퇴근테스트',
      employeeNo: uniqueEmployeeNo(),
      hireDate: '2024-01-01',
      passwordHash: 'hash',
      role: 'employee',
    });
  }

  it('create 후 findByUserIdAndWorkDate로 조회된다', async () => {
    const user = await createTestUser();

    const created = await attendanceRepository.create({
      userId: user.id,
      workDate: '2026-09-01',
      checkInAt: '2026-09-01T09:00:00+09:00',
    });

    expect(created.id).toBeDefined();

    const found = await attendanceRepository.findByUserIdAndWorkDate(user.id, '2026-09-01');
    expect(found.id).toBe(created.id);
  });

  it('updateCheckOut 후 check_out_at이 반영된다', async () => {
    const user = await createTestUser();

    const created = await attendanceRepository.create({
      userId: user.id,
      workDate: '2026-09-02',
      checkInAt: '2026-09-02T09:00:00+09:00',
    });

    const updated = await attendanceRepository.updateCheckOut(created.id, '2026-09-02T18:00:00+09:00');
    expect(updated.check_out_at).not.toBeNull();
  });

  it('listByUserIdAndMonth로 해당 월 데이터만 조회된다', async () => {
    const user = await createTestUser();

    await attendanceRepository.create({
      userId: user.id,
      workDate: '2026-09-05',
      checkInAt: '2026-09-05T09:00:00+09:00',
    });
    await attendanceRepository.create({
      userId: user.id,
      workDate: '2026-10-05',
      checkInAt: '2026-10-05T09:00:00+09:00',
    });

    const septList = await attendanceRepository.listByUserIdAndMonth(user.id, '2026-09');

    expect(septList).toHaveLength(1);
    expect(String(septList[0].work_date).slice(0, 7)).toBe('2026-09');
  });
});
