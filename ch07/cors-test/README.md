# cors-test

CORS(Cross-Origin Resource Sharing) 동작을 눈으로 확인하기 위한 최소 예제입니다. 백엔드(`http://localhost:3000`)와 프론트엔드(`http://localhost:8080`)가 서로 다른 origin에서 실행되어 실제로 CORS가 발생합니다.

## 기술 스택

- 백엔드: Express (CORS 헤더는 라이브러리 없이 환경변수 값으로 직접 설정)
- 프론트엔드: React + Vite

## 실행 방법

```bash
# 백엔드
cd backend
npm install
cp .env.example .env
npm run dev

# 프론트엔드 (다른 터미널)
cd frontend
npm install
cp .env.example .env
npm run dev
```

브라우저에서 `http://localhost:8080` 접속 후 버튼을 눌러 백엔드 API를 호출합니다.

## 환경변수

### backend/.env

| 변수                    | 설명                                                              |
| ----------------------- | ----------------------------------------------------------------- |
| `PORT`                  | 백엔드 서버 포트 (기본 3000)                                       |
| `CORS_ORIGIN`           | 허용할 origin (콤마로 여러 개 나열, `*`는 전체 허용)               |
| `CORS_METHODS`          | preflight 응답에 포함할 `Access-Control-Allow-Methods` 값          |
| `CORS_ALLOWED_HEADERS`  | preflight 응답에 포함할 `Access-Control-Allow-Headers` 값          |
| `CORS_CREDENTIALS`      | `true`로 설정 시 `Access-Control-Allow-Credentials: true` 응답     |

### frontend/.env

| 변수                  | 설명                                                    |
| --------------------- | ------------------------------------------------------- |
| `PORT`                | Vite 개발 서버 포트 (기본 8080)                          |
| `VITE_API_BASE_URL`   | 프론트엔드가 호출할 백엔드 주소 (Vite는 `VITE_` 접두사가 붙은 변수만 브라우저에 노출) |

## 확인해볼 것

- `backend/.env`의 `CORS_ORIGIN`을 프론트엔드 주소(`http://localhost:8080`)와 다르게 바꾸고 재시작한 뒤, 브라우저에서 버튼을 누르면 개발자도구 콘솔/네트워크 탭에서 CORS 에러가 발생하는 것을 확인할 수 있습니다.
- `POST /api/echo` 버튼은 커스텀 헤더(`X-Custom-Header`)를 포함하므로 브라우저가 먼저 `OPTIONS` preflight 요청을 보냅니다. 네트워크 탭에서 preflight 요청/응답을 확인해보세요.
- `CORS_ORIGIN=*`으로 바꾸면 모든 origin에서 호출이 가능해지는 것을 확인할 수 있습니다(단, `CORS_CREDENTIALS=true`와 함께 사용할 수 없다는 점도 코드에서 확인해보세요).

## 파일 구조

```
backend/
  server.js       # Express 서버, 환경변수 기반 CORS 미들웨어, API 라우트
  .env.example
frontend/
  index.html
  vite.config.js  # PORT 환경변수로 개발 서버 포트 설정
  src/
    main.jsx
    App.jsx       # 버튼으로 백엔드 API 호출, import.meta.env.VITE_API_BASE_URL 사용
  .env.example
```
