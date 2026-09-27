const { BadRequestError } = require('../../src/errors/AppError');
const { requireFields, isValidDateString, isValidMonthString } = require('../../src/utils/validate');

describe('requireFields', () => {
  it('필수 필드가 누락되면 BadRequestError를 던진다', () => {
    expect(() => requireFields({ name: '홍길동' }, ['name', 'email'])).toThrow(BadRequestError);
  });

  it('필수 필드가 모두 있으면 에러를 던지지 않는다', () => {
    expect(() => requireFields({ name: '홍길동', email: 'a@b.com' }, ['name', 'email'])).not.toThrow();
  });
});

describe('isValidDateString', () => {
  it('YYYY-MM-DD 형식의 정상 날짜는 true', () => {
    expect(isValidDateString('2024-01-15')).toBe(true);
  });

  it('형식이 틀린 값은 false', () => {
    expect(isValidDateString('2024/01/15')).toBe(false);
    expect(isValidDateString('2024-1-15')).toBe(false);
  });

  it('존재하지 않는 날짜는 false', () => {
    expect(isValidDateString('2024-13-01')).toBe(false);
  });
});

describe('isValidMonthString', () => {
  it('YYYY-MM 형식의 정상 값은 true', () => {
    expect(isValidMonthString('2024-01')).toBe(true);
  });

  it('형식이 틀린 값은 false', () => {
    expect(isValidMonthString('2024-1')).toBe(false);
    expect(isValidMonthString('2024/01')).toBe(false);
  });

  it('월 범위(01~12)를 벗어나면 false', () => {
    expect(isValidMonthString('2024-00')).toBe(false);
    expect(isValidMonthString('2024-13')).toBe(false);
    expect(isValidMonthString('2024-12')).toBe(true);
  });
});
