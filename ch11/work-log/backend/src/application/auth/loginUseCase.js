const { UnauthorizedError } = require('../../domain/errors/AppError');
const { comparePassword } = require('../../infrastructure/security/password');
const { signAccessToken, signRefreshToken, hashToken } = require('../../infrastructure/security/jwt');
const userRepository = require('../../infrastructure/repositories/UserRepository');
const refreshTokenRepository = require('../../infrastructure/repositories/RefreshTokenRepository');
const env = require('../../infrastructure/config/env');

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('이메일 또는 패스워드가 일치하지 않습니다.');
  }

  const matched = await comparePassword(password, user.passwordHash);
  if (!matched) {
    throw new UnauthorizedError('이메일 또는 패스워드가 일치하지 않습니다.');
  }

  const payload = { sub: user.id };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);
  await refreshTokenRepository.create({ userId: user.id, tokenHash, expiresAt });

  return { accessToken, refreshToken, tokenType: 'Bearer' };
}

module.exports = login;
