const { verifyAccessToken } = require('../../../infrastructure/security/jwt');
const { UnauthorizedError } = require('../../../domain/errors/AppError');

function authGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError('인증 토큰이 필요합니다.'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(new UnauthorizedError('유효하지 않거나 만료된 토큰입니다.'));
  }
}

module.exports = authGuard;
