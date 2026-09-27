const { BadRequestError } = require('../../errors/AppError');
const { isValidMonthString } = require('../../utils/validate');

function createListAllAttendancesUsecase({ attendanceRepository }) {
  return {
    async execute({ month, userId }) {
      if (!isValidMonthString(month)) {
        throw new BadRequestError('VALIDATION_ERROR', '월 형식이 올바르지 않습니다(YYYY-MM)');
      }
      return attendanceRepository.listByMonth(month, userId ?? null);
    },
  };
}

module.exports = { createListAllAttendancesUsecase };
