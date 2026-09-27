const path = require('node:path');
const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(
  session({
    secret: 'session-auth-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 5 }, // 5분 (수업용으로 짧게 설정: 세션 만료 확인 가능)
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

// 세션 동작을 눈으로 확인하기 위한 디버그용 엔드포인트
app.get('/api/session-info', requireAuth, (req, res) => {
  res.json({
    sessionId: req.sessionID,
    cookieMaxAgeMs: req.session.cookie.maxAge,
    cookieExpires: req.session.cookie.expires,
  });
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`session-auth server on http://localhost:${PORT}`));
