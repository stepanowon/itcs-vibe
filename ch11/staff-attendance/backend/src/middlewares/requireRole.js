const { ForbiddenError } = require('../errors/AppError');

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new ForbiddenError('FORBIDDEN_ROLE', '접근 권한이 없습니다'));
    }
    next();
  };
}

module.exports = { requireRole };
