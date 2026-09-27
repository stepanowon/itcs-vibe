function createCheckHealthUsecase({ checkDbConnection }) {
  return {
    async execute() {
      await checkDbConnection();
      return { status: 'ok', db: 'connected' };
    },
  };
}

module.exports = { createCheckHealthUsecase };
