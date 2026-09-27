const { UnauthorizedError } = require('../../domain/errors/AppError');
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require('../../infrastructure/security/jwt');
const refreshTokenRepository = require('../../infrastructure/repositories/RefreshTokenRepository');
const env = require('../../infrastructure/config/env');

async function refresh({ refreshToken }) {
  try {
    verifyRefreshToken(refreshToken);
  } catch (e) {
    throw new UnauthorizedError('유효하지 않거나 만료된 토큰입니다.');
  }

  const tokenHash = hashToken(refreshToken);
  const row = await refreshTokenRepository.findValidByHash(tokenHash);
  if (!row) {
    throw new UnauthorizedError('만료되었거나 무효화된 토큰입니다.');
  }

  await refreshTokenRepository.revokeByHash(tokenHash);

  const payload = { sub: row.userId };
  const accessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
  await refreshTokenRepository.create({
    userId: row.userId,
    tokenHash: hashToken(newRefreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken: newRefreshToken, tokenType: 'Bearer' };
}

module.exports = refresh;
