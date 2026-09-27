const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiresInSeconds,
} = require('../../src/utils/jwt');

describe('jwt', () => {
  const payload = { userId: 'u-1', role: 'employee' };

  it('signAccessToken으로 발급한 토큰을 verifyAccessToken으로 검증하면 payload가 일치한다', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('signRefreshToken으로 발급한 토큰을 verifyRefreshToken으로 검증하면 payload가 일치한다', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('위조된 토큰을 verify하면 에러를 던진다', () => {
    const token = signAccessToken(payload);
    const tampered = `${token}tampered`;
    expect(() => verifyAccessToken(tampered)).toThrow();
    expect(() => verifyRefreshToken(tampered)).toThrow();
  });

  it('getAccessTokenExpiresInSeconds는 숫자를 반환한다', () => {
    expect(typeof getAccessTokenExpiresInSeconds()).toBe('number');
  });
});
