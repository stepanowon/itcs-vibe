const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../src/errors/AppError');
const { errorHandler } = require('../../src/middlewares/errorHandler');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AppError 서브클래스', () => {
  it.each([
    [BadRequestError, 400],
    [UnauthorizedError, 401],
    [ForbiddenError, 403],
    [NotFoundError, 404],
    [ConflictError, 409],
  ])('%p는 status %i를 갖는다', (ErrorClass, status) => {
    const err = new ErrorClass('SOME_CODE', '에러 메시지');

    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(status);
    expect(err.code).toBe('SOME_CODE');
    expect(err.message).toBe('에러 메시지');
  });
});

describe('errorHandler', () => {
  it('AppError 전달 시 해당 status와 {code, message}를 응답한다', () => {
    const err = new NotFoundError('NOT_FOUND', '리소스를 찾을 수 없습니다');
    const res = createMockRes();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' });
  });

  it('일반 Error 전달 시 500과 INTERNAL_SERVER_ERROR를 응답한다', () => {
    const err = new Error('예상치 못한 오류');
    const res = createMockRes();

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다',
    });
  });
});
