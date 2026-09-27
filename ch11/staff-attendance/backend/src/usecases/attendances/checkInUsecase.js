const { ConflictError } = require('../../errors/AppError');

function getKstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function getKstDateString(kstDate = getKstNow()) {
  return kstDate.toISOString().slice(0, 10);
}

function createCheckInUsecase({ attendanceRepository }) {
  return {
    async execute({ userId }) {
      const workDate = getKstDateString();

      const existing = await attendanceRepository.findByUserIdAndWorkDate(userId, workDate);
      if (existing) {
        console.log(`[checkIn] 체크인 실패(중복): userId=${userId}, workDate=${workDate}`);
        throw new ConflictError('ALREADY_CHECKED_IN', '이미 체크인하셨습니다');
      }

      const record = await attendanceRepository.create({
        userId,
        workDate,
        checkInAt: new Date().toISOString(),
      });
      console.log(`[checkIn] 체크인 성공: userId=${userId}, workDate=${workDate}`);
      return record;
    },
  };
}

module.exports = { createCheckInUsecase, getKstNow, getKstDateString };
