const path = require('node:path');
const http = require('node:http');
const express = require('express');
const session = require('express-session');
const { WebSocketServer } = require('ws');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

const sessionMiddleware = session({
  secret: 'chat-socket-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 },
});

app.use(express.json());
app.use(sessionMiddleware);

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

app.use(express.static(path.join(__dirname, 'public')));

// WebSocket 업그레이드 시 세션 쿠키로 로그인 여부 확인
server.on('upgrade', (req, socket, head) => {
  sessionMiddleware(req, {}, () => {
    if (!req.session.user) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
});

wss.on('connection', (ws, req) => {
  const user = req.session.user;

  ws.on('message', (raw) => {
    let content;
    try {
      content = String(JSON.parse(raw).content || '').trim();
    } catch {
      return;
    }
    if (!content) return;

    const message = db.addMessage(user.id, content);
    const payload = JSON.stringify({ type: 'message', message });
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) client.send(payload);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`chat-socket server on http://localhost:${PORT}`));
