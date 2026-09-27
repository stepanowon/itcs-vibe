const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('GET /api/v1/health', () => {
  afterAll(() => pool.end());

  it('실제 DB 연결이 정상일 때 200과 함께 status/db/timestamp를 반환한다', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });

  it('존재하지 않는 경로 호출 시 404와 NOT_FOUND를 반환한다', async () => {
    const res = await request(app).get('/api/v1/no-such-route');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
