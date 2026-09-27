const { UnauthorizedError } = require('../../domain/errors/AppError');
const { hashToken } = require('../../infrastructure/security/tokenHash');

const INVALID_REFRESH_MESSAGE = 'Refresh Token이 유효하지 않습니다. 다시 로그인해주세요.';

// 토큰 회전(rotation) 정책 채택: 재발급 시 기존 Refresh Token은 폐기하고 새 Refresh Token을 함께 발급한다.
class RefreshUseCase {
  constructor(refreshTokenRepository, jwtProvider) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.jwtProvider = jwtProvider;
  }

  async execute(refreshToken) {
    let payload;
    try {
      payload = this.jwtProvider.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new UnauthorizedError(INVALID_REFRESH_MESSAGE);
    }

    const tokenHash = hashToken(refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!record || record.revoked || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError(INVALID_REFRESH_MESSAGE);
    }

    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);

    const newAccessToken = this.jwtProvider.signAccessToken(payload.sub);
    const newRefreshToken = this.jwtProvider.signRefreshToken(payload.sub);

    await this.refreshTokenRepository.create({
      userId: payload.sub,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + this.jwtProvider.refreshTtlSeconds * 1000),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtProvider.accessTtlSeconds,
    };
  }
}

module.exports = { RefreshUseCase };
