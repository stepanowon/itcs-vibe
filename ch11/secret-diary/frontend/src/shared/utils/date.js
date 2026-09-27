export function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDiaryDate(dateString) {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('-')
  return `${year}. ${Number(month)}. ${Number(day)}.`
}

export function formatJoinDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`
}
