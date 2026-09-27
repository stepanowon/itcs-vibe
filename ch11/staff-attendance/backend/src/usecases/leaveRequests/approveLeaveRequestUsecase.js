const { NotFoundError, ForbiddenError, ConflictError, BadRequestError } = require('../../errors/AppError');
const { withTransaction } = require('../../infrastructure/db/withTransaction');

function assertProcessable(record, processorId) {
  if (!record) {
    throw new NotFoundError('LEAVE_REQUEST_NOT_FOUND', '연차 신청을 찾을 수 없습니다');
  }
  if (record.requester_id === processorId) {
    throw new ForbiddenError('SELF_APPROVAL_NOT_ALLOWED', '본인이 신청한 연차는 본인이 처리할 수 없습니다');
  }
}

function createApproveLeaveRequestUsecase({ leaveRequestRepository, leaveBalanceRepository }) {
  return {
    async execute({ id, processorId }) {
      const record = await leaveRequestRepository.findById(id);
      assertProcessable(record, processorId);

      let updated;
      try {
        // 상태 변경(approved)과 사용일수 차감을 한 트랜잭션으로 묶어, 중간에
        // used_days<=total_days CHECK 위반이 나도 상태 변경까지 함께 롤백되게 한다.
        updated = await withTransaction(async (client) => {
          const result = await leaveRequestRepository.updateStatusIfPending(
            id,
            { status: 'approved', processorId, processedAt: new Date().toISOString() },
            client,
          );
          if (!result) {
            throw new ConflictError('LEAVE_REQUEST_ALREADY_PROCESSED', '이미 처리된 신청입니다');
          }
          await leaveBalanceRepository.incrementUsedDays(record.requester_id, record.days, client);
          return result;
        });
      } catch (err) {
        if (err.code === '23514') {
          throw new BadRequestError('INSUFFICIENT_LEAVE_BALANCE', '잔여 연차일수가 부족합니다');
        }
        throw err;
      }

      console.log(`[approveLeaveRequest] 승인 성공: id=${id}, processorId=${processorId}`);
      return updated;
    },
  };
}

module.exports = { createApproveLeaveRequestUsecase, assertProcessable };
