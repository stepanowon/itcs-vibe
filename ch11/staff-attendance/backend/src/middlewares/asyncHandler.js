// 컨트롤러 메서드의 반복되는 try/catch(next) 보일러플레이트를 제거한다.
function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

module.exports = { asyncHandler };
