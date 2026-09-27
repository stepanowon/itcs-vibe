const express = require('express');
const request = require('supertest');
const authGuard = require('../../src/interfaces/http/middlewares/authGuard');
const errorHandler = require('../../src/interfaces/http/middlewares/errorHandler');
const { signAccessToken } = require('../../src/infrastructure/security/jwt');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', authGuard, (req, res) => {
    res.json({ userId: req.user.userId });
  });
  app.use(errorHandler);
  return app;
}

describe('authGuard', () => {
  it('유효한 토큰이면 요청을 통과시키고 req.user를 채운다', async () => {
    const app = buildApp();
    const token = signAccessToken({ userId: 'u1' });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
  });

  it('Authorization 헤더가 없으면 401을 반환한다', async () => {
    const app = buildApp();

    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('다른 시크릿으로 서명된 위조 토큰이면 401을 반환한다', async () => {
    const app = buildApp();
    const forgedToken = require('jsonwebtoken').sign({ userId: 'u1' }, 'wrong-secret');

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
