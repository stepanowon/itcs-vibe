const express = require('express');
const request = require('supertest');
const errorHandler = require('../../src/interfaces/http/middlewares/errorHandler');
const { NotFoundError } = require('../../src/domain/errors/AppError');

function buildApp() {
  const app = express();
  app.get('/not-found', (req, res, next) => {
    next(new NotFoundError('없음'));
  });
  app.get('/boom', () => {
    throw new Error('unexpected');
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('AppError는 지정된 statusCode와 code/message로 응답한다', async () => {
    const app = buildApp();

    const res = await request(app).get('/not-found');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND', message: '없음' });
  });

  it('예기치 못한 에러는 500과 내부 에러 코드로 응답하고 원본 메시지를 노출하지 않는다', async () => {
    const app = buildApp();

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.message).not.toBe('unexpected');
  });
});
