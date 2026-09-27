const KOREAN_DAY_NAMES = {
  SUNDAY: '일',
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
};

export function toKoreanDayOfWeek(dayOfWeek) {
  return KOREAN_DAY_NAMES[dayOfWeek] ?? dayOfWeek;
}
