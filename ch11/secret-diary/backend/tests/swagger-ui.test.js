const request = require('supertest');
const { createApp } = require('../src/interfaces/http/app');

describe('GET /api-docs (Swagger UI)', () => {
  const app = createApp();

  it('Swagger UI HTML 페이지를 200으로 반환한다', async () => {
    const res = await request(app).get('/api-docs/').set('Accept', 'text/html');

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('swagger-ui');
  });

  it('trailing slash 없이 접근 시 /api-docs/ 로 리다이렉트한다', async () => {
    const res = await request(app).get('/api-docs');

    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/api-docs/');
  });
});
