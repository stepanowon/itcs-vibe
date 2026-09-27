const express = require('express');
const request = require('supertest');
const { z } = require('zod');
const { validate } = require('../src/interfaces/http/middlewares/validate');
const { notFoundHandler } = require('../src/interfaces/http/middlewares/notFoundHandler');
const { errorHandler } = require('../src/interfaces/http/middlewares/errorHandler');
const { asyncHandler } = require('../src/interfaces/http/asyncHandler');
const { NotFoundError } = require('../src/domain/errors/AppError');

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const schema = z.object({ name: z.string().min(1) });
  app.post('/echo', validate(schema), (req, res) => {
    res.status(200).json({ name: req.body.name });
  });

  app.get(
    '/boom',
    asyncHandler(async () => {
      throw new NotFoundError('테스트 리소스 없음');
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('공통 미들웨어', () => {
  const app = buildTestApp();

  it('validate 통과 시 정상 처리된다', async () => {
    const res = await request(app).post('/echo').send({ name: '홍길동' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: '홍길동' });
  });

  it('validate 실패 시 400 + 필드 오류를 반환한다', async () => {
    const res = await request(app).post('/echo').send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    expect(res.body.details[0]).toHaveProperty('field', 'name');
  });

  it('asyncHandler로 던진 AppError가 errorHandler에서 처리된다', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND', message: '테스트 리소스 없음' });
  });

  it('정의되지 않은 라우트는 404를 반환한다', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('일반 Error는 500 + INTERNAL_ERROR로 처리된다', async () => {
    const app2 = express();
    app2.get(
      '/fail',
      asyncHandler(async () => {
        throw new Error('예상치 못한 오류');
      })
    );
    app2.use(errorHandler);

    const res = await request(app2).get('/fail');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});
