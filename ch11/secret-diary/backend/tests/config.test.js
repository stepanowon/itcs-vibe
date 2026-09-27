describe('config (.env 로딩)', () => {
  it('.env를 로딩하여 필수 설정값을 제공한다', () => {
    const { config } = require('../src/infrastructure/config/env');

    expect(config.dbConnString).toBeTruthy();
    expect(config.port).toBeGreaterThan(0);
    expect(config.nodeEnv).toBeTruthy();
  });

  it('Access/Refresh JWT 비밀키가 서로 다른 값으로 로딩된다', () => {
    const { config } = require('../src/infrastructure/config/env');

    expect(config.jwtAccessSecret).toBeTruthy();
    expect(config.jwtRefreshSecret).toBeTruthy();
    expect(config.jwtAccessSecret).not.toBe(config.jwtRefreshSecret);
  });

  it('Access/Refresh 토큰 TTL(초)이 설정된다', () => {
    const { config } = require('../src/infrastructure/config/env');

    expect(config.accessTokenTtlSeconds).toBeGreaterThan(0);
    expect(config.refreshTokenTtlSeconds).toBeGreaterThan(config.accessTokenTtlSeconds);
  });

  it('CORS_ORIGIN이 배열로 파싱된다', () => {
    const { config } = require('../src/infrastructure/config/env');

    expect(Array.isArray(config.corsOrigins)).toBe(true);
    expect(config.corsOrigins.length).toBeGreaterThan(0);
  });
});
