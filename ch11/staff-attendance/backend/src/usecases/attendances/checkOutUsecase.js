const { BadRequestError } = require('../../errors/AppError');
const { getKstNow, getKstDateString } = require('./checkInUsecase');

function createCheckOutUsecase({ attendanceRepository }) {
  return {
    async execute({ userId }) {
      // 자정을 넘겨 체크아웃하는 경우 "오늘" 날짜로는 체크인 기록을 찾을 수 없으므로,
      // 가장 최근 근무 기록(체크인일 그대로 귀속)을 찾되, 그 기록이 오늘/어제자인 경우에만 인정한다.
      // (그보다 오래된 기록이면 오늘 체크인이 없는 것으로 간주 — 옛 근무일의 체크아웃 시각을
      // 실수로 덮어쓰는 것을 방지)
      // 체크아웃은 여러 번 가능하며, 매번 최종 클릭 시각으로 덮어쓴다.
      const kstNow = getKstNow();
      const today = getKstDateString(kstNow);
      const yesterday = getKstDateString(new Date(kstNow.getTime() - 24 * 60 * 60 * 1000));

      const existing = await attendanceRepository.findLatestByUserId(userId);
      if (!existing || ![today, yesterday].includes(existing.work_date)) {
        console.log(`[checkOut] 체크아웃 실패(체크인 없음): userId=${userId}`);
        throw new BadRequestError('CHECK_IN_NOT_FOUND', '체크인 기록이 없습니다');
      }

      const record = await attendanceRepository.updateCheckOut(existing.id, new Date().toISOString());
      console.log(`[checkOut] 체크아웃 성공: userId=${userId}, workDate=${existing.work_date}`);
      return record;
    },
  };
}

module.exports = { createCheckOutUsecase };
