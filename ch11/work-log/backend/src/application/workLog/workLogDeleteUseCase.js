const workLogRepository = require('../../infrastructure/repositories/WorkLogRepository');
const { NotFoundError, ForbiddenError } = require('../../domain/errors/AppError');

async function deleteWorkLog({ userId, id }) {
  const found = await workLogRepository.findById(id);
  if (!found) throw new NotFoundError('업무일지를 찾을 수 없습니다.');
  if (found.userId !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  await workLogRepository.softDelete(id);
}

module.exports = deleteWorkLog;
