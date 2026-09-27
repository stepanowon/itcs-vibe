const { pool, checkConnection, withTransaction } = require('../src/infrastructure/db/pool');

afterAll(async () => {
  await pool.end();
});

describe('DB 커넥션 풀', () => {
  it('checkConnection이 SELECT 1로 연결 상태를 확인한다', async () => {
    await expect(checkConnection()).resolves.toBe(true);
  });

  it('withTransaction은 성공 시 COMMIT하고 콜백 결과를 반환한다', async () => {
    const result = await withTransaction(async (client) => {
      const res = await client.query('SELECT 2 AS value');
      return res.rows[0].value;
    });
    expect(result).toBe(2);
  });

  it('withTransaction은 실패 시 ROLLBACK하고 에러를 전파한다', async () => {
    await expect(
      withTransaction(async (client) => {
        await client.query('SELECT 1');
        throw new Error('강제 실패');
      })
    ).rejects.toThrow('강제 실패');
  });
});
