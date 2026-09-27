// RefreshToken 리포지토리 인터페이스
class IRefreshTokenRepository {
  async create(_refreshToken) {
    throw new Error('Not implemented');
  }

  async findByTokenHash(_tokenHash) {
    throw new Error('Not implemented');
  }

  async revokeByTokenHash(_tokenHash) {
    throw new Error('Not implemented');
  }

  async revokeAllByUserId(_userId) {
    throw new Error('Not implemented');
  }
}

module.exports = { IRefreshTokenRepository };
