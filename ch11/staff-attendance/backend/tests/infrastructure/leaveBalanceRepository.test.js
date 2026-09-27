const pool = require('../../src/config/db');
const userRepository = require('../../src/infrastructure/db/userRepository');
const leaveBalanceRepository = require('../../src/infrastructure/db/leaveBalanceRepository');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

function uniqueEmployeeNo() {
  return `TEST-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

describe('leaveBalanceRepository', () => {
  afterAll(() => pool.end());

  async function createTestUser() {
    return userRepository.create({
      email: uniqueEmail(),
      name: '잔여연차테스트',
      employeeNo: uniqueEmployeeNo(),
      hireDate: '2024-01-01',
      passwordHash: 'hash',
      role: 'employee',
    });
  }

  it('create 후 findByUserId로 조회된다', async () => {
    const user = await createTestUser();

    const created = await leaveBalanceRepository.create({
      userId: user.id,
      totalDays: 15,
      usedDays: 0,
    });

    expect(created.id).toBeDefined();

    const found = await leaveBalanceRepository.findByUserId(user.id);
    expect(found.user_id).toBe(user.id);
    expect(Number(found.total_days)).toBe(15);
  });

  it('incrementUsedDays/setTotalDays 후 값이 반영된다', async () => {
    const user = await createTestUser();
    await leaveBalanceRepository.create({ userId: user.id, totalDays: 15, usedDays: 0 });

    const afterUsed = await leaveBalanceRepository.incrementUsedDays(user.id, 2);
    expect(Number(afterUsed.used_days)).toBe(2);

    const afterTotal = await leaveBalanceRepository.setTotalDays(user.id, 18);
    expect(Number(afterTotal.total_days)).toBe(18);
  });

  it('listAllWithUserHireDate에 생성한 유저가 포함된다', async () => {
    const user = await createTestUser();
    await leaveBalanceRepository.create({ userId: user.id, totalDays: 15, usedDays: 0 });

    const list = await leaveBalanceRepository.listAllWithUserHireDate();
    const found = list.find((item) => item.user_id === user.id);

    expect(found).toBeDefined();
    expect(found.hire_date).toBeDefined();
  });
});
