const path = require('node:path');
const express = require('express');
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./api-docs.json');
const db = require('./db');

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.json());
app.use(
  session({
    secret: 'chat-polling-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.findUserByUsername(username);
  if (!user || !db.verifyPassword(user, password)) {
    return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
  req.session.user = { id: user.id, username: user.username, displayName: user.display_name };
  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/messages', requireAuth, (req, res) => {
  const after = Number(req.query.after) || 0;
  res.json({ messages: db.getMessagesAfter(after) });
});

app.post('/api/messages', requireAuth, (req, res) => {
  const content = (req.body?.content || '').trim();
  if (!content) return res.status(400).json({ error: '메시지 내용이 없습니다.' });
  const id = db.addMessage(req.session.user.id, content);
  res.status(201).json({ id });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`chat-polling server on http://localhost:${PORT}`));
