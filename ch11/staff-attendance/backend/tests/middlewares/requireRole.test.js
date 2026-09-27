const { requireRole } = require('../../src/middlewares/requireRole');
const { ForbiddenError } = require('../../src/errors/AppError');

describe('requireRole', () => {
  it('req.user.role이 요구하는 role과 다르면 next가 ForbiddenError로 호출된다', () => {
    const req = { user: { id: 'u-1', role: 'employee' } };
    const next = jest.fn();

    requireRole('manager')(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ForbiddenError);
  });

  it('req.user.role이 요구하는 role과 같으면 next가 인자 없이 호출된다', () => {
    const req = { user: { id: 'u-1', role: 'manager' } };
    const next = jest.fn();

    requireRole('manager')(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
