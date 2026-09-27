const pool = require('../../src/config/db');
const userRepository = require('../../src/infrastructure/db/userRepository');

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

function uniqueEmployeeNo() {
  return `TEST-${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

describe('userRepository', () => {
  afterAll(() => pool.end());

  it('create로 사용자 생성 후 findByEmail/findByEmployeeNo/findById로 조회된다', async () => {
    const email = uniqueEmail();
    const employeeNo = uniqueEmployeeNo();

    const created = await userRepository.create({
      email,
      name: '홍길동',
      employeeNo,
      hireDate: '2024-01-01',
      passwordHash: 'hashed-password',
      role: 'employee',
    });

    expect(created.id).toBeDefined();
    expect(created.email).toBe(email);

    const byEmail = await userRepository.findByEmail(email);
    const byEmployeeNo = await userRepository.findByEmployeeNo(employeeNo);
    const byId = await userRepository.findById(created.id);

    expect(byEmail.id).toBe(created.id);
    expect(byEmployeeNo.id).toBe(created.id);
    expect(byId.id).toBe(created.id);
  });

  it('updatePassword 후 다시 조회 시 password_hash가 바뀐다', async () => {
    const email = uniqueEmail();
    const created = await userRepository.create({
      email,
      name: '김철수',
      employeeNo: uniqueEmployeeNo(),
      hireDate: '2024-01-01',
      passwordHash: 'old-hash',
      role: 'employee',
    });

    await userRepository.updatePassword(created.id, 'new-hash');

    const updated = await userRepository.findById(created.id);
    expect(updated.password_hash).toBe('new-hash');
  });

  it('createWithInitialManagerCheck를 동시 호출해도 advisory lock으로 직렬화되어 manager가 중복 생성되지 않고 각각 leave_balances가 함께 생성된다', async () => {
    const [resultA, resultB] = await Promise.all([
      userRepository.createWithInitialManagerCheck({
        email: uniqueEmail(),
        name: '동시가입A',
        employeeNo: uniqueEmployeeNo(),
        hireDate: '2024-01-01',
        passwordHash: 'hash-a',
      }),
      userRepository.createWithInitialManagerCheck({
        email: uniqueEmail(),
        name: '동시가입B',
        employeeNo: uniqueEmployeeNo(),
        hireDate: '2024-01-01',
        passwordHash: 'hash-b',
      }),
    ]);

    const roles = [resultA.role, resultB.role];
    expect(roles.every((r) => r === 'manager' || r === 'employee')).toBe(true);
    // advisory lock으로 두 트랜잭션이 직렬화되므로, 동시에 매니저가 2명 생성될 수 없다.
    expect(roles.filter((r) => r === 'manager').length).toBeLessThanOrEqual(1);

    const balanceA = await pool.query('SELECT * FROM leave_balances WHERE user_id = $1', [resultA.id]);
    const balanceB = await pool.query('SELECT * FROM leave_balances WHERE user_id = $1', [resultB.id]);

    expect(balanceA.rows).toHaveLength(1);
    expect(balanceB.rows).toHaveLength(1);
  });
});
