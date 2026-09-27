const { NotFoundError } = require('../../domain/errors/AppError');

class GetMyProfileUseCase {
  constructor(userRepository, diaryRepository) {
    this.userRepository = userRepository;
    this.diaryRepository = diaryRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    const diaryCount = await this.diaryRepository.countByUserId(userId);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      diaryCount,
    };
  }
}

module.exports = { GetMyProfileUseCase };
