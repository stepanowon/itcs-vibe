const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');

describe('GET /health (헬스체크)', () => {
  const app = createApp();

  it('200과 { status: "ok" } 를 반환한다', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
