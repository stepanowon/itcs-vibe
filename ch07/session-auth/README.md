# session-auth

세션 기반 인증(session-based authentication)의 동작 원리를 확인하기 위한 최소 예제입니다.

## 기술 스택

- Node.js (`node:sqlite`, `node:crypto` 내장 모듈 사용)
- Express, express-session
- 프론트엔드: 순수 HTML/CSS/JS (프레임워크 없음)

## 실행 방법

```bash
npm install
npm start

# 개발 서버로 실행 (파일 변경 시 자동 재시작)
npm run dev
```

기본적으로 `http://localhost:3000` 에서 실행됩니다. (`PORT` 환경변수로 변경 가능)

## 로그인 계정

최초 실행 시 `data/session-auth.db`에 아래 테스트 계정이 자동으로 생성됩니다.

| 아이디 | 비밀번호  | 표시 이름 |
| ------ | --------- | --------- |
| user1  | asdf!2345 | 홍길동    |
| user2  | asdf!2345 | 이몽룡    |

## 동작 방식

- `/api/login`, `/api/logout`, `/api/me` : 세션 기반 로그인/로그아웃/로그인 확인
- `/api/session-info` : 로그인 시 서버가 발급한 세션 ID와 쿠키 만료 시각을 확인 (수업용 디버그 엔드포인트)
- 로그인 성공 시 서버는 `req.session.user`에 사용자 정보를 저장하고, 브라우저에는 `connect.sid` 쿠키(세션 ID)만 전달됩니다.
- 세션 쿠키 만료 시간은 학습 목적으로 5분(`cookie.maxAge`)으로 짧게 설정되어 있습니다. 마이페이지(`mypage.html`)에서 5분이 지난 뒤 새로고침하면 다시 로그인 페이지로 이동하는 것을 확인할 수 있습니다.
- `public/mypage.html`은 `requireAuth` 미들웨어로 보호된 페이지의 예시로, 로그인하지 않은 상태에서 접근하면 `index.html`로 리다이렉트됩니다.

## 확인해볼 것

- 브라우저 개발자도구 > Application > Cookies 에서 `connect.sid` 쿠키 값을 확인해보세요. 쿠키에는 사용자 정보가 아니라 세션 ID만 들어있습니다.
- 시크릿 창(또는 다른 브라우저)에서 같은 계정으로 로그인하면 서로 다른 세션 ID가 발급되는 것을 `/api/session-info`로 비교해보세요.

## 파일 구조

```
server.js          # Express 서버, 세션 설정, API 라우트
db.js               # SQLite 스키마, 사용자 조회/비밀번호 검증 함수
public/
  index.html        # 로그인 페이지
  login.js
  mypage.html        # 로그인 후 접근 가능한 보호된 페이지
  mypage.js
data/session-auth.db # SQLite 데이터 파일 (자동 생성)
```

## 참고

- 비밀번호는 `scrypt`로 해시하여 저장합니다.
- 세션 시크릿(`session-auth-demo-secret`)은 학습용 예제 값이므로 운영 환경에서는 반드시 환경변수 등으로 교체해야 합니다.
- 세션 저장소는 기본 `MemoryStore`를 사용합니다(운영 환경에는 부적합하며, Redis 등 별도 스토어 사용이 권장됩니다). 사용자 계정 데이터만 파일 DB(SQLite)에 저장합니다.
