// 로컬(브라우저) 타임존 기준 날짜/시간 포맷 유틸
const pad = (n) => String(n).padStart(2, '0')

export function formatDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatMonth(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatTime(dateTime) {
  if (!dateTime) return '--:--'
  const d = new Date(dateTime)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
