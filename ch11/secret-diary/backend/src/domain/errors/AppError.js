// 표준 에러 응답 포맷 {code, message, details} 을 구성하기 위한 도메인 에러 타입들
class AppError extends Error {
  constructor(code, message, statusCode, details) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message = '요청이 올바르지 않습니다.', details) {
    super('BAD_REQUEST', message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.') {
    super('UNAUTHORIZED', message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = '접근 권한이 없습니다.') {
    super('FORBIDDEN', message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다.') {
    super('NOT_FOUND', message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = '이미 존재하는 리소스입니다.') {
    super('CONFLICT', message, 409);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
