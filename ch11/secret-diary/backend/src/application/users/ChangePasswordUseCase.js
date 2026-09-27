const { BadRequestError, NotFoundError } = require('../../domain/errors/AppError');

class ChangePasswordUseCase {
  constructor(userRepository, passwordHasher, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute({ userId, currentPassword, newPassword }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    const matches = await this.passwordHasher.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestError('현재 비밀번호가 올바르지 않습니다.');
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePasswordHash(userId, newPasswordHash);

    // (P1) 변경 성공 시 기존 Refresh Token을 모두 무효화한다.
    await this.refreshTokenRepository.revokeAllByUserId(userId);
  }
}

module.exports = { ChangePasswordUseCase };
