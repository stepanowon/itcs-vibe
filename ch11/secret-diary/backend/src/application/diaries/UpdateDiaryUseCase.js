const { NotFoundError, ForbiddenError } = require('../../domain/errors/AppError');

class UpdateDiaryUseCase {
  constructor(diaryRepository) {
    this.diaryRepository = diaryRepository;
  }

  async execute({ id, userId, title, content, weather, mood, diaryDate, tags }) {
    const existing = await this.diaryRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('일기를 찾을 수 없습니다.');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenError('접근 권한이 없습니다.');
    }

    return this.diaryRepository.updateById(id, userId, {
      title,
      content,
      weather,
      mood,
      diaryDate,
      tags,
    });
  }
}

module.exports = { UpdateDiaryUseCase };
