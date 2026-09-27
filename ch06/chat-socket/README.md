# chat-socket

세션 기반 로그인과 WebSocket 방식으로 동작하는 간단한 채팅 예제입니다. (chat-polling과 동일 기능, 실시간 갱신 방식만 교체)

## 기술 스택

- Node.js (`node:sqlite`, `node:crypto` 내장 모듈 사용)
- Express, express-session, ws
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

`npm start` 실행 시마다 `data/chat.db`를 삭제하고 새로 생성하며, 아래 테스트 계정이 자동으로 시드됩니다. (이전 대화 기록은 매 실행마다 초기화됩니다)

| 아이디 | 비밀번호  | 표시 이름 |
| ------ | --------- | --------- |
| user1  | asdf!2345 | 홍길동    |
| user2  | asdf!2345 | 이몽룡    |
| user3  | asdf!2345 | 성춘향    |

## 동작 방식

- `/api/login`, `/api/logout`, `/api/me` : 세션 기반 로그인/로그아웃/로그인 확인
- `/api/messages` (GET) : 페이지 로드시 대화 이력 조회
- WebSocket 연결(`ws://.../`) : 로그인 세션 쿠키로 업그레이드 요청을 인증하고, 이후 채팅 메시지를 실시간으로 주고받음
  - 클라이언트가 메시지를 보내면 서버가 DB에 저장 후 접속 중인 모든 클라이언트에 즉시 브로드캐스트

## 파일 구조

```
server.js        # Express 서버 + WebSocket 업그레이드/브로드캐스트
db.js            # SQLite 스키마, 사용자/메시지 조회 함수
public/
  index.html     # 로그인 페이지
  login.js
  chat.html      # 채팅 페이지
  chat.js        # WebSocket 연결/전송 로직
data/chat.db     # SQLite 데이터 파일 (자동 생성)
```

## 참고

- 비밀번호는 `scrypt`로 해시하여 저장합니다.
- 세션 시크릿(`chat-socket-demo-secret`)은 학습용 예제 값이므로 운영 환경에서는 반드시 환경변수 등으로 교체해야 합니다.
- WebSocket 인증은 `express-session` 미들웨어를 업그레이드 요청에도 그대로 적용해 세션 쿠키를 검증하는 방식입니다.
