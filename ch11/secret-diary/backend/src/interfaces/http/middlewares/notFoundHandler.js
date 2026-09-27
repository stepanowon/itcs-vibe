const { NotFoundError } = require('../../../domain/errors/AppError');

// 정의되지 않은 라우트에 대한 404 처리 (반드시 모든 라우트 등록 이후에 마운트)
function notFoundHandler(req, res, next) {
  next(new NotFoundError('요청하신 경로를 찾을 수 없습니다.'));
}

module.exports = { notFoundHandler };
