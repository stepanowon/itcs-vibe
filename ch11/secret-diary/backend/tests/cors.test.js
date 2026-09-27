const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');
const { config } = require('../src/infrastructure/config/env');

describe('CORS (CORS_ORIGIN)', () => {
  const app = createApp();

  it('허용된 origin 요청에는 Access-Control-Allow-Origin 헤더를 반환한다', async () => {
    const allowedOrigin = config.corsOrigins[0];
    const res = await request(app).get('/health').set('Origin', allowedOrigin);

    expect(res.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });

  it('허용되지 않은 origin 요청에는 Access-Control-Allow-Origin 헤더를 반환하지 않는다', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://not-allowed.example.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
