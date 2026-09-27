const { BadRequestError } = require('../../errors/AppError');
const { calcTotalDays } = require('../../utils/leaveAccrual');
const { withTransaction } = require('../../infrastructure/db/withTransaction');

function createUpdateLeavePolicyUsecase({ leavePolicyRepository, leaveBalanceRepository }) {
  return {
    async execute({ baseDays }) {
      if (typeof baseDays !== 'number' || Number.isNaN(baseDays) || baseDays < 0) {
        throw new BadRequestError('VALIDATION_ERROR', '공통 연차일수는 0 이상의 숫자여야 합니다');
      }

      try {
        // 정책 저장과 전체 직원 재계산을 한 트랜잭션으로 묶어, 중간에 특정 직원에서
        // used_days<=total_days CHECK 위반이 나도 일부만 반영되는 반쪽짜리 상태를 방지한다.
        return await withTransaction(async (client) => {
          const policy = await leavePolicyRepository.setBaseDays(baseDays, client);

          const balances = await leaveBalanceRepository.listAllWithUserHireDate(client);
          for (const balance of balances) {
            const totalDays = calcTotalDays(baseDays, balance.hire_date);
            await leaveBalanceRepository.setTotalDays(balance.user_id, totalDays, client);
          }
          console.log(`[updateLeavePolicy] 공통 연차일수 변경 및 전체 재계산: baseDays=${baseDays}, updated=${balances.length}`);
          return policy;
        });
      } catch (err) {
        if (err.code === '23514') {
          throw new BadRequestError(
            'INVALID_TOTAL_DAYS',
            '일부 직원의 이미 사용한 연차일수가 새 총 연차일수보다 많아 적용할 수 없습니다',
          );
        }
        throw err;
      }
    },
  };
}

module.exports = { createUpdateLeavePolicyUsecase };
