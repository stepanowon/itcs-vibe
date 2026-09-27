// 연차 정책 계산 유틸(입사연도 기준, 캘린더 연도 차이로 계산).
// - 해당연도(올해) 입사자: 공통연차 미적용, 0일
// - 전년도 입사자: 공통연차일수 그대로
// - 그 이전 입사자: 공통연차일수 + (지난 햇수 - 1) — 1년마다 1일씩 가산
function yearsSinceHire(hireDate) {
  const hireYear = new Date(hireDate).getFullYear();
  const currentYear = new Date().getFullYear();
  return currentYear - hireYear;
}

function calcTotalDays(baseDays, hireDate) {
  const yearsAgo = yearsSinceHire(hireDate);
  if (yearsAgo <= 0) return 0;
  return Number(baseDays) + (yearsAgo - 1);
}

module.exports = { yearsSinceHire, calcTotalDays };
