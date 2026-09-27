const { ConflictError } = require('../../domain/errors/AppError');
const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');
const { toDayOfWeek } = require('../../domain/workLog/dayOfWeek');

async function createWorkLog({ userId, logDate, title, content, issueSolution, isCompleted, tomorrowPlan }) {
  let created;
  try {
    created = await workLogRepository.create({
      userId,
      logDate,
      title,
      content,
      issueSolution,
      isCompleted,
      tomorrowPlan,
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('해당 날짜에 이미 작성된 업무일지가 있습니다.');
    }
    throw error;
  }

  return { ...created, dayOfWeek: toDayOfWeek(logDate) };
}

module.exports = createWorkLog;
