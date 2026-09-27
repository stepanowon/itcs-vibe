const { authenticate } = require('../../src/middlewares/authenticate');
const { signAccessToken } = require('../../src/utils/jwt');
const { UnauthorizedError } = require('../../src/errors/AppError');

describe('authenticate', () => {
  const mockRes = () => ({});

  it('Authorization 헤더가 없으면 next가 UnauthorizedError로 호출된다', () => {
    const req = { headers: {} };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  it('유효한 토큰이면 req.user가 채워지고 next가 인자 없이 호출된다', () => {
    const token = signAccessToken({ userId: 'u-1', role: 'manager' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(req.user).toEqual({ id: 'u-1', role: 'manager' });
    expect(next).toHaveBeenCalledWith();
  });

  it('위조된 토큰이면 next가 UnauthorizedError로 호출된다', () => {
    const token = signAccessToken({ userId: 'u-1', role: 'manager' });
    const req = { headers: { authorization: `Bearer ${token}tampered` } };
    const next = jest.fn();

    authenticate(req, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });
});
