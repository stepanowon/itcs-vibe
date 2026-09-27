function createGetLeavePolicyUsecase({ leavePolicyRepository }) {
  return {
    async execute() {
      return await leavePolicyRepository.get();
    },
  };
}

module.exports = { createGetLeavePolicyUsecase };
