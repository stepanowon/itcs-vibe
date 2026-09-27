const { BadRequestError } = require('../../errors/AppError');
const { isValidMonthString } = require('../../utils/validate');

function createListMyAttendancesUsecase({ attendanceRepository }) {
  return {
    async execute({ userId, month }) {
      if (!isValidMonthString(month)) {
        throw new BadRequestError('VALIDATION_ERROR', '월 형식이 올바르지 않습니다(YYYY-MM)');
      }
      return attendanceRepository.listByUserIdAndMonth(userId, month);
    },
  };
}

module.exports = { createListMyAttendancesUsecase };
