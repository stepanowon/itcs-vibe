const { JwtProvider } = require('../../../infrastructure/security/JwtProvider');
const { config } = require('../../../infrastructure/config/env');
const { UnauthorizedError } = require('../../../domain/errors/AppError');

const jwtProvider = new JwtProvider({
  accessSecret: config.jwtAccessSecret,
  refreshSecret: config.jwtRefreshSecret,
  accessTtlSeconds: config.accessTokenTtlSeconds,
  refreshTtlSeconds: config.refreshTokenTtlSeconds,
});

// Authorization: Bearer <accessToken> 검증 후 req.user에 사용자 식별자를 주입한다.
function authGuard(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError());
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwtProvider.verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(new UnauthorizedError());
  }
}

module.exports = { authGuard, jwtProvider };
