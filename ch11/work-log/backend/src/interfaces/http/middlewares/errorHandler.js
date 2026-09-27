const { AppError } = require('../../../domain/errors/AppError');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  console.error(err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
}

module.exports = errorHandler;
