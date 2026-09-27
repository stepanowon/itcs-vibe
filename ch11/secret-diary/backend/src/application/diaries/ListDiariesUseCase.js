class ListDiariesUseCase {
  constructor(diaryRepository) {
    this.diaryRepository = diaryRepository;
  }

  async execute({ userId, weather, mood, tag, page, limit }) {
    const { items, total } = await this.diaryRepository.list({
      userId,
      weather,
      mood,
      tag,
      page,
      limit,
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = { ListDiariesUseCase };
