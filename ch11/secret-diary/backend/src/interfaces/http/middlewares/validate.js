const { BadRequestError } = require('../../../domain/errors/AppError');

// zod 스키마로 req[source](body/query/params)를 검증하고, 실패 시 필드별 오류(details)를 담아 400을 발생시킨다.
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      next(new BadRequestError('입력값이 올바르지 않습니다.', details));
      return;
    }

    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
