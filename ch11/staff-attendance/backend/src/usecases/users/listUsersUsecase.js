function createListUsersUsecase({ userRepository }) {
  return {
    async execute() {
      const users = await userRepository.findAll();
      console.log(`[listUsers] 전체 사용자 조회: ${users.length}건`);
      return users;
    },
  };
}

module.exports = { createListUsersUsecase };
