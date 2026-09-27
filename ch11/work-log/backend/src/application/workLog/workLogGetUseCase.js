const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');
const { toDayOfWeek } = require('../../domain/workLog/dayOfWeek');
const { NotFoundError, ForbiddenError } = require('../../domain/errors/AppError');

async function getWorkLog({ userId, id }) {
  const found = await workLogRepository.findById(id);
  if (!found) throw new NotFoundError('업무일지를 찾을 수 없습니다.');
  if (found.userId !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const { userId: _drop, ...rest } = found;
  return { ...rest, dayOfWeek: toDayOfWeek(found.logDate) };
}

module.exports = getWorkLog;
