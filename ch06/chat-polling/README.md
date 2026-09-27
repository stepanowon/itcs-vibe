# chat-polling

세션 기반 로그인과 폴링(polling) 방식으로 동작하는 간단한 채팅 예제입니다.

## 기술 스택

- Node.js (`node:sqlite`, `node:crypto` 내장 모듈 사용)
- Express, express-session
- 프론트엔드: 순수 HTML/CSS/JS (프레임워크 없음)

## 실행 방법

```bash
# 실행
npm install
npm start

# 개발 서버로 실행
npm install
npm run dev
```

기본적으로 `http://localhost:3000` 에서 실행됩니다. (`PORT` 환경변수로 변경 가능)

개발 중에는 `npm run dev`로 실행하면 `nodemon`이 파일 변경을 감지해 서버를 자동 재시작합니다.

## 로그인 계정

최초 실행 시 `data/chat.db`에 아래 테스트 계정이 자동으로 생성됩니다.

| 아이디 | 비밀번호  | 표시 이름 |
| ------ | --------- | --------- |
| user1  | asdf!2345 | 홍길동    |
| user2  | asdf!2345 | 이몽룡    |
| user3  | asdf!2345 | 성춘향    |

## 동작 방식

- `/api/login`, `/api/logout`, `/api/me` : 세션 기반 로그인/로그아웃/로그인 확인
- `/api/messages` (GET) : `after` 파라미터(마지막으로 받은 메시지 id) 이후의 새 메시지 조회
- `/api/messages` (POST) : 메시지 전송
- 클라이언트(`public/chat.js`)는 `setInterval`로 30초마다 `/api/messages`를 폴링하여 새 메시지를 화면에 반영합니다.

## 파일 구조

```
server.js        # Express 서버, API 라우트
db.js            # SQLite 스키마, 사용자/메시지 조회 함수
public/
  index.html     # 로그인 페이지
  login.js
  chat.html      # 채팅 페이지
  chat.js        # 메시지 폴링/전송 로직
data/chat.db     # SQLite 데이터 파일 (자동 생성)
```

## 참고

- 비밀번호는 `scrypt`로 해시하여 저장합니다.
- 세션 시크릿(`chat-polling-demo-secret`)은 학습용 예제 값이므로 운영 환경에서는 반드시 환경변수 등으로 교체해야 합니다.
