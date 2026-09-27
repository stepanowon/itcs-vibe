const { ConflictError } = require('../../errors/AppError');
const { assertProcessable } = require('./approveLeaveRequestUsecase');

function createRejectLeaveRequestUsecase({ leaveRequestRepository }) {
  return {
    async execute({ id, processorId }) {
      const record = await leaveRequestRepository.findById(id);
      assertProcessable(record, processorId);

      const updated = await leaveRequestRepository.updateStatusIfPending(id, {
        status: 'rejected',
        processorId,
        processedAt: new Date().toISOString(),
      });
      if (!updated) {
        throw new ConflictError('LEAVE_REQUEST_ALREADY_PROCESSED', '이미 처리된 신청입니다');
      }

      console.log(`[rejectLeaveRequest] 반려 성공: id=${id}, processorId=${processorId}`);
      return updated;
    },
  };
}

module.exports = { createRejectLeaveRequestUsecase };
