const { UnauthorizedError } = require('../../domain/errors/AppError');
const { hashToken } = require('../../infrastructure/security/tokenHash');

class LogoutUseCase {
  constructor(refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ refreshToken, userId }) {
    const tokenHash = hashToken(refreshToken);
    const record = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!record || record.userId !== userId) {
      throw new UnauthorizedError('유효하지 않은 Refresh Token입니다.');
    }

    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
  }
}

module.exports = { LogoutUseCase };
