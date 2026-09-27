const { NotFoundError } = require('../../errors/AppError');

function createGetMyLeaveBalanceUsecase({ leaveBalanceRepository }) {
  return {
    async execute({ userId }) {
      const balance = await leaveBalanceRepository.findByUserId(userId);
      if (!balance) {
        throw new NotFoundError('LEAVE_BALANCE_NOT_FOUND', '연차 잔여정보를 찾을 수 없습니다');
      }
      return balance;
    },
  };
}

module.exports = { createGetMyLeaveBalanceUsecase };
