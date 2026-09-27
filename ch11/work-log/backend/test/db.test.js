const pool = require('../src/infrastructure/db/pool');
const { testConnection } = pool;

describe('DB connection', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('testConnection resolves without error', async () => {
    await expect(testConnection()).resolves.not.toThrow();
  });
});
