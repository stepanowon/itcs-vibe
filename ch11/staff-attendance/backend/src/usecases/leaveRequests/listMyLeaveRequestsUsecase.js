function createListMyLeaveRequestsUsecase({ leaveRequestRepository }) {
  return {
    async execute({ requesterId, month }) {
      return leaveRequestRepository.listByRequesterId(requesterId, month);
    },
  };
}

module.exports = { createListMyLeaveRequestsUsecase };
