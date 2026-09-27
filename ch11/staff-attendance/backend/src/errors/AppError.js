class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
class BadRequestError extends AppError { constructor(code, message) { super(400, code, message); } }
class UnauthorizedError extends AppError { constructor(code, message) { super(401, code, message); } }
class ForbiddenError extends AppError { constructor(code, message) { super(403, code, message); } }
class NotFoundError extends AppError { constructor(code, message) { super(404, code, message); } }
class ConflictError extends AppError { constructor(code, message) { super(409, code, message); } }

module.exports = { AppError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError };
