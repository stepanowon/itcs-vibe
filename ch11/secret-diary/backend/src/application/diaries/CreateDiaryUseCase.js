class CreateDiaryUseCase {
  constructor(diaryRepository) {
    this.diaryRepository = diaryRepository;
  }

  async execute({ userId, title, content, weather, mood, diaryDate, tags }) {
    return this.diaryRepository.create({ userId, title, content, weather, mood, diaryDate, tags });
  }
}

module.exports = { CreateDiaryUseCase };
