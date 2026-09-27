require('dotenv').config();
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_REDIRECT_URI = process.env.NAVER_REDIRECT_URI || 'http://localhost:3000/auth/naver/callback';

// 운영 배포 시 FE/BE가 서로 다른 도메인(cross-site)이면 sameSite:'none'+secure:true(HTTPS 필수)가 필요.
// 로컬 개발(localhost 포트만 다름, same-site)에서는 sameSite:'lax'로 충분.
const isProd = process.env.NODE_ENV === 'production';

// 리버스 프록시(Nginx, Render, Heroku 등) 뒤에서 HTTPS 종료 시 secure 쿠키가 설정되려면 필요
if (isProd) app.set('trust proxy', 1);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: 'social-auth-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 30,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
    },
  })
);

// 로그인된 세션이 없으면 401로 막는 인증 가드
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: '로그인이 필요합니다.' });
  next();
}

app.get('/', (req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>social-auth backend API</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #222; }
  h1 { font-size: 1.4rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 0.9rem; }
  code { background: #f3f3f3; padding: 2px 5px; border-radius: 4px; }
</style>
</head>
<body>
  <h1>social-auth backend API</h1>
  <p>네이버 아이디로 로그인(OAuth 2.0) 예제 백엔드입니다.</p>
  <table>
    <tr><th>Method</th><th>Path</th><th>설명</th></tr>
    <tr><td>GET</td><td><code>/auth/naver</code></td><td>네이버 로그인 시작 (인증 페이지로 리다이렉트)</td></tr>
    <tr><td>GET</td><td><code>/auth/naver/callback</code></td><td>네이버 로그인 콜백 (code → 토큰 교환, 세션 저장)</td></tr>
    <tr><td>GET</td><td><code>/api/me</code></td><td>현재 로그인한 사용자 정보 조회</td></tr>
    <tr><td>GET</td><td><code>/api/profile</code></td><td>로그인 필요(<code>requireAuth</code>), 비로그인 시 401</td></tr>
    <tr><td>POST</td><td><code>/api/logout</code></td><td>로그아웃 (세션 파기)</td></tr>
  </table>
</body>
</html>`);
});

// 1) 네이버 로그인 시작: state(CSRF 방지용 임의값)를 세션에 저장하고 네이버 인증 페이지로 리다이렉트
app.get('/auth/naver', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.naverState = state;

  const authUrl = new URL('https://nid.naver.com/oauth2.0/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', NAVER_REDIRECT_URI);
  authUrl.searchParams.set('state', state);

  res.redirect(authUrl.toString());
});

// 2) 네이버 로그인 콜백: code를 access token으로 교환하고, 프로필을 조회해 세션에 저장
app.get('/auth/naver/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state || state !== req.session.naverState) {
    return res.status(400).send('state 값이 일치하지 않습니다. (CSRF 공격 의심)');
  }
  delete req.session.naverState;

  try {
    const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', NAVER_CLIENT_ID);
    tokenUrl.searchParams.set('client_secret', NAVER_CLIENT_SECRET);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('state', state);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || '토큰 발급 실패');
    }

    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    if (profileData.resultcode !== '00') {
      throw new Error(profileData.message || '프로필 조회 실패');
    }

    const { id, email, name, nickname, profile_image: profileImage } = profileData.response;
    // accessToken/refreshToken은 교육용으로 화면에 노출하기 위해 세션에 저장 (운영 환경에서는 저장하지 않는 것을 권장)
    req.session.user = {
      id,
      email,
      name,
      nickname,
      profileImage,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    };

    res.redirect(FRONTEND_URL);
  } catch (err) {
    console.error('네이버 로그인 실패:', err);
    res.redirect(`${FRONTEND_URL}?error=${encodeURIComponent(err.message)}`);
  }
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// requireAuth로 보호되는 API 예시: 로그인하지 않은 상태로 호출하면 401
app.get('/api/profile', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`social-auth backend on http://localhost:${PORT}`);
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.warn('경고: NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 설정되지 않았습니다. .env 파일을 확인하세요.');
  }
});
