const { AppError } = require('../errors/AppError');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    console.error(`[error] ${err.status} ${err.code}: ${err.message}`);
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다' });
}

module.exports = { errorHandler };
