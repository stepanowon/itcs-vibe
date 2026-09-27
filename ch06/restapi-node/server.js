const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const db = require('./db');

const app = express();
app.use(express.json());

// Swagger UI: http://localhost:8080/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});



// ── 1. 데이터 저장소 (db.json 파일 기반, lowdb) ──────────────────
// db.js에서 초기화한 lowdb 인스턴스를 그대로 사용합니다.
// 모든 변경은 .write()가 호출되는 순간 db.json에 즉시 저장됩니다.

// ── 2. 라우팅 ────────────────────────────────────────────────────

/**
 * @openapi
 * /todos:
 *   get:
 *     summary: 할 일 목록 조회
 *     tags: [Todos]
 *     responses:
 *       200:
 *         description: 전체 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 */
app.get('/todos', (req, res) => {
  res.json(db.get('todos').value());
});

/**
 * @openapi
 * /todos/{id}:
 *   get:
 *     summary: 할 일 단건 조회
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Todo' }
 *       404:
 *         description: 존재하지 않는 id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/todos/:id', (req, res) => {
  const todo = db.get('todos').find({ id: Number(req.params.id) }).value();
  if (!todo) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `id ${req.params.id}를 찾을 수 없습니다.` });
  }
  res.json(todo);
});

/**
 * @openapi
 * /todos:
 *   post:
 *     summary: 할 일 생성
 *     tags: [Todos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: '새로운 할 일' }
 *               done: { type: boolean, example: false }
 *     responses:
 *       201:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Todo' }
 *       400:
 *         description: title 누락
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.post('/todos', (req, res) => {
  const { title, done } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'title은 필수입니다.' });
  }
  const id = db.get('nextId').value();
  const newTodo = { id, title, done: Boolean(done) };
  db.get('todos').push(newTodo).write();
  db.set('nextId', id + 1).write();
  res.status(201).json(newTodo);
});

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *     summary: 할 일 수정
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               done: { type: boolean }
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Todo' }
 *       404:
 *         description: 존재하지 않는 id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.put('/todos/:id', (req, res) => {
  const query = db.get('todos').find({ id: Number(req.params.id) });
  if (!query.value()) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `id ${req.params.id}를 찾을 수 없습니다.` });
  }
  const { title, done } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (done !== undefined) changes.done = Boolean(done);
  const updated = query.assign(changes).write();
  res.json(updated);
});

/**
 * @openapi
 * /todos/{id}:
 *   delete:
 *     summary: 할 일 삭제
 *     tags: [Todos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Todo' }
 *       404:
 *         description: 존재하지 않는 id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.delete('/todos/:id', (req, res) => {
  const todo = db.get('todos').find({ id: Number(req.params.id) }).value();
  if (!todo) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `id ${req.params.id}를 찾을 수 없습니다.` });
  }
  db.get('todos').remove({ id: Number(req.params.id) }).write();
  res.json(todo);
});

// ── 3. 공통 에러 처리 ────────────────────────────────────────────

// 정의되지 않은 경로
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: '존재하지 않는 경로입니다.' });
});

// 잘못된 JSON 본문 등 처리 중 발생한 에러
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'BAD_REQUEST', message: '요청 본문이 올바른 JSON이 아닙니다.' });
  }
  res.status(500).json({ error: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`REST API 서버 실행: http://localhost:${PORT}/todos`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(`Swagger Spec: http://localhost:${PORT}/api-docs.json`);
});
