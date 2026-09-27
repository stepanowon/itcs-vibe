const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');
const { toDayOfWeek } = require('../../domain/workLog/dayOfWeek');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../domain/errors/AppError');

async function updateWorkLog({ userId, id, ...fields }) {
  const found = await workLogRepository.findById(id);
  if (!found) throw new NotFoundError('업무일지를 찾을 수 없습니다.');
  if (found.userId !== userId) throw new ForbiddenError('접근 권한이 없습니다.');

  let updated;
  try {
    updated = await workLogRepository.update(id, fields);
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('해당 날짜에 이미 작성된 업무일지가 있습니다.');
    }
    throw error;
  }

  return { ...updated, dayOfWeek: toDayOfWeek(updated.logDate) };
}

module.exports = updateWorkLog;
