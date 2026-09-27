const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../errors/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('INVALID_TOKEN', '인증 토큰이 필요합니다'));
  }
  try {
    const { userId, role } = verifyAccessToken(header.slice(7));
    req.user = { id: userId, role };
    console.log(`[auth] 인증 성공 userId=${userId}`);
    next();
  } catch (err) {
    next(new UnauthorizedError('INVALID_TOKEN', '유효하지 않은 토큰입니다'));
  }
}

module.exports = { authenticate };
