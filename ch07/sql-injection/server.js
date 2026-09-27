const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { db } = require('./db');

const app = express();
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SQL Injection 실습 API',
      version: '1.0.0',
      description:
        '취약(vulnerable) 엔드포인트와 안전(safe) 엔드포인트를 비교하며 SQL Injection을 실습하기 위한 예제입니다.',
    },
  },
  apis: [__filename],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/login-vulnerable:
 *   post:
 *     summary: "[취약] 문자열을 조합한 로그인 쿼리 (SQL Injection 가능)"
 *     description: |
 *       입력값을 검증/이스케이프 없이 SQL 문자열에 그대로 삽입합니다.
 *       예) username에 `' OR '1'='1' -- ` 를 입력하면 비밀번호 없이 로그인 우회가 가능합니다.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "' OR '1'='1' -- " }
 *               password: { type: string, example: "아무값" }
 *     responses:
 *       200: { description: 로그인 성공 (응답에 실행된 SQL 포함) }
 *       401: { description: 로그인 실패 }
 */
app.post('/api/login-vulnerable', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const sql = `SELECT id, username, email, role FROM users WHERE username = '${username}' AND password = '${password}'`;
  let user;
  try {
    user = db.prepare(sql).get();
  } catch (err) {
    return res.status(400).json({ error: String(err.message), executedSql: sql });
  }
  if (!user) return res.status(401).json({ error: '로그인 실패', executedSql: sql });
  res.json({ user, executedSql: sql });
});

/**
 * @openapi
 * /api/login-safe:
 *   post:
 *     summary: "[안전] Prepared Statement(파라미터 바인딩)를 사용하는 로그인"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "' OR '1'='1' -- " }
 *               password: { type: string, example: "아무값" }
 *     responses:
 *       200: { description: 로그인 성공 }
 *       401: { description: 로그인 실패 }
 */
app.post('/api/login-safe', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const user = db
    .prepare('SELECT id, username, email, role FROM users WHERE username = ? AND password = ?')
    .get(username, password);
  if (!user) return res.status(401).json({ error: '로그인 실패' });
  res.json({ user });
});

/**
 * @openapi
 * /api/search-vulnerable:
 *   get:
 *     summary: "[취약] 문자열을 조합한 사용자 검색 쿼리 (UNION 기반 Injection 가능)"
 *     description: |
 *       예) keyword에 `x' UNION SELECT id, username, password, role FROM users -- ` 를 입력하면
 *       검색 결과로 위장해 password 컬럼까지 그대로 노출됩니다.
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         example: "x' UNION SELECT id, username, password, role FROM users -- "
 *     responses:
 *       200: { description: 검색 결과 (응답에 실행된 SQL 포함) }
 */
app.get('/api/search-vulnerable', (req, res) => {
  const keyword = req.query.keyword || '';
  const sql = `SELECT id, username, email, role FROM users WHERE username LIKE '%${keyword}%'`;
  try {
    const rows = db.prepare(sql).all();
    res.json({ rows, executedSql: sql });
  } catch (err) {
    res.status(400).json({ error: String(err.message), executedSql: sql });
  }
});

/**
 * @openapi
 * /api/search-safe:
 *   get:
 *     summary: "[안전] Prepared Statement(파라미터 바인딩)를 사용하는 사용자 검색"
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema: { type: string }
 *         example: "x' UNION SELECT id, username, password, role FROM users -- "
 *     responses:
 *       200: { description: 검색 결과 }
 */
app.get('/api/search-safe', (req, res) => {
  const keyword = req.query.keyword || '';
  const rows = db
    .prepare('SELECT id, username, email, role FROM users WHERE username LIKE ?')
    .all(`%${keyword}%`);
  res.json({ rows });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`sql-injection server on http://localhost:${PORT} (Swagger UI: /api-docs)`)
);
