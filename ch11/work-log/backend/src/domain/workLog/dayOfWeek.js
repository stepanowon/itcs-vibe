const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function toDayOfWeek(logDate) {
  return DAY_NAMES[new Date(logDate + 'T00:00:00Z').getUTCDay()];
}

module.exports = { toDayOfWeek };
