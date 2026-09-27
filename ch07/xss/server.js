const express = require('express');
const { messages, addMessage } = require('./db');

const app = express();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));

// 실습용 데모 쿠키. httpOnly를 끄고 발급해 XSS로 document.cookie를 탈취할 수 있음을 보여줍니다.
// 실제 서비스에서는 세션 쿠키에 반드시 httpOnly(+ secure)를 설정해야 합니다.
app.use((req, res, next) => {
  res.cookie('demo_session', 'SECRET-TOKEN-1234', { httpOnly: false });
  next();
});

function render(res, mode, q) {
  res.render('guestbook', { mode, q: q || '', messages });
}

// [취약] 검색어(reflected)와 방명록 내용(stored) 모두 이스케이프 없이 그대로 출력합니다.
app.get('/vulnerable', (req, res) => render(res, 'vulnerable', req.query.q));
app.post('/vulnerable/messages', (req, res) => {
  addMessage(req.body.name || '익명', req.body.text || '');
  res.redirect('/vulnerable');
});

// [안전] EJS의 <%= %>가 자동으로 HTML 이스케이프를 해줍니다.
app.get('/safe', (req, res) => render(res, 'safe', req.query.q));
app.post('/safe/messages', (req, res) => {
  addMessage(req.body.name || '익명', req.body.text || '');
  res.redirect('/safe');
});

app.get('/', (req, res) => res.redirect('/vulnerable'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`xss server on http://localhost:${PORT}`));
