const { BcryptHasher } = require('../src/infrastructure/security/BcryptHasher');
const { JwtProvider } = require('../src/infrastructure/security/JwtProvider');
const { hashToken } = require('../src/infrastructure/security/tokenHash');

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher();

  it('hash/compare가 원문 비밀번호를 검증한다', async () => {
    const hash = await hasher.hash('P@ssw0rd!');
    expect(hash).not.toBe('P@ssw0rd!');
    await expect(hasher.compare('P@ssw0rd!', hash)).resolves.toBe(true);
    await expect(hasher.compare('wrong-password', hash)).resolves.toBe(false);
  });
});

describe('JwtProvider', () => {
  const provider = new JwtProvider({
    accessSecret: 'test-access-secret',
    refreshSecret: 'test-refresh-secret',
    accessTtlSeconds: 60,
    refreshTtlSeconds: 120,
  });
  const userId = 'user-123';

  it('Access/Refresh 토큰을 발급하고 검증한다', () => {
    const accessToken = provider.signAccessToken(userId);
    const refreshToken = provider.signRefreshToken(userId);

    const accessPayload = provider.verifyAccessToken(accessToken);
    const refreshPayload = provider.verifyRefreshToken(refreshToken);

    expect(accessPayload.sub).toBe(userId);
    expect(accessPayload.type).toBe('access');
    expect(refreshPayload.sub).toBe(userId);
    expect(refreshPayload.type).toBe('refresh');
  });

  it('Access/Refresh 토큰의 만료 시간(exp-iat)이 설정된 TTL을 따른다', () => {
    const jwt = require('jsonwebtoken');
    const accessPayload = jwt.decode(provider.signAccessToken(userId));
    const refreshPayload = jwt.decode(provider.signRefreshToken(userId));

    expect(accessPayload.exp - accessPayload.iat).toBe(60);
    expect(refreshPayload.exp - refreshPayload.iat).toBe(120);
  });

  it('만료된 토큰 검증 시 오류를 던진다', () => {
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign({ sub: userId, type: 'access' }, 'test-access-secret', {
      expiresIn: -10,
    });

    expect(() => provider.verifyAccessToken(expiredToken)).toThrow();
  });

  it('위조된 토큰 검증 시 오류를 던진다', () => {
    const accessToken = provider.signAccessToken(userId);
    const tampered = `${accessToken}tampered`;

    expect(() => provider.verifyAccessToken(tampered)).toThrow();
  });

  it('access 토큰을 refresh로 검증하면 오류를 던진다(서로 다른 비밀키 + 타입 불일치)', () => {
    const accessToken = provider.signAccessToken(userId);
    expect(() => provider.verifyRefreshToken(accessToken)).toThrow();
  });

  it('Access/Refresh는 서로 다른 비밀키로 서명되어 상대 비밀키로는 검증되지 않는다', () => {
    const jwt = require('jsonwebtoken');
    const refreshToken = provider.signRefreshToken(userId);

    expect(() => jwt.verify(refreshToken, 'test-access-secret')).toThrow();
    expect(() => jwt.verify(provider.signAccessToken(userId), 'test-refresh-secret')).toThrow();
  });
});

describe('hashToken', () => {
  it('동일 입력에 대해 결정적인 해시를 반환한다', () => {
    const a = hashToken('same-token');
    const b = hashToken('same-token');
    const c = hashToken('different-token');

    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
