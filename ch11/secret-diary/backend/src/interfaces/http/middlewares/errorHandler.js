const { AppError } = require('../../../domain/errors/AppError');
const { logger } = require('../../../infrastructure/logging/logger');

// 표준 에러 응답 포맷 {code, message, details}을 반환하는 중앙 에러 핸들러 (반드시 마지막에 등록)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const body = { code: err.code, message: err.message };
    if (err.details) body.details = err.details;
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error(err.stack ?? String(err));
  res.status(500).json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
}

module.exports = { errorHandler };
