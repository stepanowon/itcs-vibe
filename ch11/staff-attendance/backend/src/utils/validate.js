const { BadRequestError } = require('../errors/AppError');

// signup(회원가입)/createManager(관리자 계정 생성)가 공통으로 쓰는 입력 검증
function validateSignupInput({ email, name, employeeNo, hireDate, password }) {
  requireFields({ email, name, employeeNo, hireDate, password }, ['email', 'name', 'employeeNo', 'hireDate', 'password']);
  if (!isValidDateString(hireDate)) {
    throw new BadRequestError('VALIDATION_ERROR', '입사일 형식이 올바르지 않습니다');
  }
  if (!password || password.length < 8) {
    throw new BadRequestError('VALIDATION_ERROR', '비밀번호는 8자 이상이어야 합니다');
  }
}

function requireFields(obj, fields) {
  const missing = fields.filter((field) => obj[field] === undefined || obj[field] === null || obj[field] === '');
  if (missing.length > 0) {
    throw new BadRequestError('VALIDATION_ERROR', `필수 항목이 누락되었습니다: ${missing.join(', ')}`);
  }
}

function isValidDateString(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const date = new Date(str);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === str;
}

function isValidMonthString(str) {
  return typeof str === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(str);
}

module.exports = { requireFields, isValidDateString, isValidMonthString, validateSignupInput };
