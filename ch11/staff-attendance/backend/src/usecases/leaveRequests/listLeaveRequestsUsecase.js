function createListLeaveRequestsUsecase({ leaveRequestRepository }) {
  return {
    async execute({ status, month, userId }) {
      return leaveRequestRepository.listAll({ status, month, userId });
    },
  };
}

module.exports = { createListLeaveRequestsUsecase };
