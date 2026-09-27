const { UnauthorizedError } = require('../../domain/errors/AppError');
const { verifyRefreshToken, hashToken } = require('../../infrastructure/security/jwt');
const refreshTokenRepository = require('../../infrastructure/repositories/RefreshTokenRepository');

async function logout({ refreshToken }) {
  try {
    verifyRefreshToken(refreshToken);
  } catch (e) {
    throw new UnauthorizedError('유효하지 않거나 만료된 토큰입니다.');
  }

  const tokenHash = hashToken(refreshToken);
  const revoked = await refreshTokenRepository.revokeByHash(tokenHash);
  if (!revoked) {
    throw new UnauthorizedError('만료되었거나 무효화된 토큰입니다.');
  }
}

module.exports = logout;
