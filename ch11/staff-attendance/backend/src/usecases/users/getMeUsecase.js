function createGetMeUsecase({ userRepository }) {
  return {
    async execute({ userId }) {
      const user = await userRepository.findById(userId);
      console.log(`[getMe] 내 정보 조회: ${userId}`);
      return user;
    },
  };
}

module.exports = { createGetMeUsecase };
