const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');
const { toDayOfWeek } = require('../../domain/workLog/dayOfWeek');

function toPositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

async function listWorkLogs({ userId, isCompleted, page, limit }) {
  const parsedPage = toPositiveInt(page, 1);
  const parsedLimit = toPositiveInt(limit, 20);
  const parsedIsCompleted = isCompleted === undefined ? undefined : (isCompleted === 'true' || isCompleted === true);
  const { items, total } = await workLogRepository.findMany({
    userId,
    isCompleted: parsedIsCompleted,
    page: parsedPage,
    limit: parsedLimit,
  });
  return {
    items: items.map((item) => ({ ...item, dayOfWeek: toDayOfWeek(item.logDate) })),
    page: parsedPage,
    limit: parsedLimit,
    total,
  };
}

module.exports = listWorkLogs;
