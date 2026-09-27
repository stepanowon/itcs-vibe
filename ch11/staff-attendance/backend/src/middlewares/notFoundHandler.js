function notFoundHandler(req, res, next) {
  res.status(404).json({ code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다' });
}

module.exports = { notFoundHandler };
