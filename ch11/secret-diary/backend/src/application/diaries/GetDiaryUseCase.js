const { NotFoundError, ForbiddenError } = require('../../domain/errors/AppError');

class GetDiaryUseCase {
  constructor(diaryRepository) {
    this.diaryRepository = diaryRepository;
  }

  async execute({ id, userId }) {
    const diary = await this.diaryRepository.findById(id);

    if (!diary) {
      throw new NotFoundError('일기를 찾을 수 없습니다.');
    }
    if (diary.userId !== userId) {
      throw new ForbiddenError('접근 권한이 없습니다.');
    }

    return diary;
  }
}

module.exports = { GetDiaryUseCase };
