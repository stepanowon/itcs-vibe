const express = require('express');
const request = require('supertest');
const { requireFields } = require('../../src/interfaces/http/middlewares/validate');
const errorHandler = require('../../src/interfaces/http/middlewares/errorHandler');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/x', requireFields(['title']), (req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('requireFields', () => {
  it('필수 필드가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
    const app = buildApp();

    const res = await request(app).post('/x').send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('필수 필드가 빈 문자열이면 400을 반환한다', async () => {
    const app = buildApp();

    const res = await request(app).post('/x').send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('필수 필드가 있으면 통과시킨다', async () => {
    const app = buildApp();

    const res = await request(app).post('/x').send({ title: '제목' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
