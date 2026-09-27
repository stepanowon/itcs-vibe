require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
const allowedMethods = process.env.CORS_METHODS || 'GET,POST';
const allowedHeaders = process.env.CORS_ALLOWED_HEADERS || 'Content-Type';
const allowCredentials = process.env.CORS_CREDENTIALS === 'true';

// 환경변수 값으로만 동작하는 CORS 미들웨어 (직접 헤더를 다뤄서 동작 원리를 확인하기 위함)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
    return res.sendStatus(204);
  }

  next();
});

app.get('/api/data', (req, res) => {
  res.json({ message: '서버에서 보낸 데이터입니다.', time: new Date().toISOString() });
});

app.post('/api/echo', (req, res) => {
  res.json({ received: req.body });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`cors-test backend on http://localhost:${PORT}`);
  console.log(`  CORS_ORIGIN=${allowedOrigins.join(', ') || '(없음)'}`);
});
