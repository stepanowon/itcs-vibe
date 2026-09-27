const { createCheckHealthUsecase } = require('../src/usecases/checkHealthUsecase');

describe('checkHealthUsecase', () => {
  it('checkDbConnection이 성공하면 status:ok, db:connected를 반환한다', async () => {
    const checkDbConnection = jest.fn().mockResolvedValue();
    const usecase = createCheckHealthUsecase({ checkDbConnection });

    const result = await usecase.execute();

    expect(checkDbConnection).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'ok', db: 'connected' });
  });

  it('checkDbConnection이 실패하면 에러를 그대로 전파한다', async () => {
    const error = new Error('연결 실패');
    const checkDbConnection = jest.fn().mockRejectedValue(error);
    const usecase = createCheckHealthUsecase({ checkDbConnection });

    await expect(usecase.execute()).rejects.toThrow('연결 실패');
  });
});
