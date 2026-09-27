const pool = require('../../src/config/db');
const userRepository = require('../../src/infrastructure/db/userRepository');
const leaveRequestRepository = require('../../src/infrastructure/db/leaveRequestRepository');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

function uniqueEmployeeNo() {
  return `TEST-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

describe('leaveRequestRepository', () => {
  afterAll(() => pool.end());

  async function createTestUser(role = 'employee') {
    return userRepository.create({
      email: uniqueEmail(),
      name: '연차테스트',
      employeeNo: uniqueEmployeeNo(),
      hireDate: '2024-01-01',
      passwordHash: 'hash',
      role,
    });
  }

  it('create 후 findById로 조회되며 status는 pending이 기본값이다', async () => {
    const requester = await createTestUser();

    const created = await leaveRequestRepository.create({
      requesterId: requester.id,
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      days: 1,
      reason: '개인 사유',
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe('pending');

    const found = await leaveRequestRepository.findById(created.id);
    expect(found.id).toBe(created.id);
    expect(found.status).toBe('pending');
  });

  it('pending 건에 updateStatusIfPending을 적용하면 정상 UPDATE되고, 이미 approved인 건에 재적용하면 null을 반환한다', async () => {
    const requester = await createTestUser();
    const processor = await createTestUser('manager');

    const created = await leaveRequestRepository.create({
      requesterId: requester.id,
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      days: 1,
      reason: '개인 사유',
    });

    const approved = await leaveRequestRepository.updateStatusIfPending(created.id, {
      status: 'approved',
      processorId: processor.id,
      processedAt: new Date().toISOString(),
    });

    expect(approved).not.toBeNull();
    expect(approved.status).toBe('approved');

    const reprocessed = await leaveRequestRepository.updateStatusIfPending(created.id, {
      status: 'rejected',
      processorId: processor.id,
      processedAt: new Date().toISOString(),
    });

    expect(reprocessed).toBeNull();
  });

  it('listByRequesterId로 신청자 본인 건 조회 시 requester_name 필드가 포함된다', async () => {
    const requester = await createTestUser();

    await leaveRequestRepository.create({
      requesterId: requester.id,
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      days: 1,
      reason: '개인 사유',
    });

    const list = await leaveRequestRepository.listByRequesterId(requester.id);

    expect(list.length).toBeGreaterThan(0);
    expect(list[0].requester_name).toBe('연차테스트');
  });
});
