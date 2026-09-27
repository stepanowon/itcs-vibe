const { createHealthController } = require('../src/controllers/healthController');

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('healthController', () => {
  it('usecase가 성공하면 200과 status/db/timestamp를 응답한다', async () => {
    const checkHealthUsecase = { execute: jest.fn().mockResolvedValue({ status: 'ok', db: 'connected' }) };
    const controller = createHealthController(checkHealthUsecase);
    const res = createMockRes();

    await controller({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
    expect(body.timestamp).toBeDefined();
  });

  it('usecase가 실패하면 503과 status:error, db:disconnected를 응답한다', async () => {
    const checkHealthUsecase = { execute: jest.fn().mockRejectedValue(new Error('DB down')) };
    const controller = createHealthController(checkHealthUsecase);
    const res = createMockRes();

    await controller({}, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', db: 'disconnected' });
  });
});
