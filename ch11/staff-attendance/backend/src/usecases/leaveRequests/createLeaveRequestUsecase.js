const { requireFields, isValidDateString } = require('../../utils/validate');
const { BadRequestError } = require('../../errors/AppError');

function createCreateLeaveRequestUsecase({ leaveRequestRepository, leaveBalanceRepository }) {
  return {
    async execute({ requesterId, startDate, endDate, reason, halfDay }) {
      requireFields({ requesterId, startDate, endDate, reason }, ['requesterId', 'startDate', 'endDate', 'reason']);

      if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        throw new BadRequestError('VALIDATION_ERROR', '날짜 형식이 올바르지 않습니다');
      }
      if (startDate > endDate) {
        throw new BadRequestError('INVALID_DATE_RANGE', '시작일이 종료일보다 늦을 수 없습니다');
      }
      if (halfDay != null && halfDay !== 'am' && halfDay !== 'pm') {
        throw new BadRequestError('VALIDATION_ERROR', '반차 구분은 am 또는 pm이어야 합니다');
      }
      if (halfDay && startDate !== endDate) {
        throw new BadRequestError('VALIDATION_ERROR', '반차는 시작일과 종료일이 같아야 합니다');
      }

      const days = halfDay ? 0.5 : (new Date(endDate) - new Date(startDate)) / 86400000 + 1;

      const balance = await leaveBalanceRepository.findByUserId(requesterId);
      if ((balance?.remaining_days ?? 0) < days) {
        throw new BadRequestError('INSUFFICIENT_LEAVE_BALANCE', '잔여 연차일수가 부족합니다');
      }

      const record = await leaveRequestRepository.create({
        requesterId,
        startDate,
        endDate,
        days,
        reason,
        halfDay: halfDay ?? null,
      });
      console.log(`[createLeaveRequest] 연차 신청 성공: requesterId=${requesterId}, days=${days}`);
      return record;
    },
  };
}

module.exports = { createCreateLeaveRequestUsecase };
