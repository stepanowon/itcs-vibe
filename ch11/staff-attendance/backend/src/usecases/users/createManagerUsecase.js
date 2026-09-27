const { validateSignupInput } = require('../../utils/validate');
const { hashPassword } = require('../../utils/password');
const { assertNoDuplicateUser, rethrowAsDuplicateConflict } = require('../auth/signupUsecase');
const { calcTotalDays } = require('../../utils/leaveAccrual');
const { withTransaction } = require('../../infrastructure/db/withTransaction');

function createCreateManagerUsecase({ userRepository, leaveBalanceRepository, leavePolicyRepository }) {
  return {
    async execute({ email, name, employeeNo, hireDate, password }) {
      validateSignupInput({ email, name, employeeNo, hireDate, password });

      await assertNoDuplicateUser(userRepository, { email, employeeNo });

      const policy = await leavePolicyRepository.get();
      const totalDays = calcTotalDays(policy.base_days, hireDate);

      const passwordHash = await hashPassword(password);
      let user;
      try {
        // 사용자 생성과 leave_balances 생성을 한 트랜잭션으로 묶어, leave_balances 생성
        // 실패 시 leave_balances 없는 사용자만 남는 것을 방지한다.
        user = await withTransaction(async (client) => {
          const created = await userRepository.create(
            { email, name, employeeNo, hireDate, passwordHash, role: 'manager' },
            client,
          );
          await leaveBalanceRepository.create({ userId: created.id, totalDays, usedDays: 0 }, client);
          return created;
        });
      } catch (err) {
        rethrowAsDuplicateConflict(err);
      }
      console.log(`[createManager] 관리자 계정 생성 성공: ${user.email}`);
      return user;
    },
  };
}

module.exports = { createCreateManagerUsecase };
