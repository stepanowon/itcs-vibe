// async 라우트 핸들러의 예외/rejection을 errorHandler로 전달한다.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
