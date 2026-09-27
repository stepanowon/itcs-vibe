const { ValidationError } = require('../../../domain/errors/AppError');

function requireFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const value = req.body ? req.body[f] : undefined;
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return next(new ValidationError('필수 항목이 누락되었습니다: ' + missing.join(', ')));
    }

    next();
  };
}

module.exports = { requireFields };
