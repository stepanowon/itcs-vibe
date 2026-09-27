function createListLeaveBalancesUsecase({ leaveBalanceRepository }) {
  return {
    async execute() {
      const balances = await leaveBalanceRepository.listAllWithUser();
      console.log(`[listLeaveBalances] 전체 연차 잔여 조회: ${balances.length}건`);
      return balances;
    },
  };
}

module.exports = { createListLeaveBalancesUsecase };
