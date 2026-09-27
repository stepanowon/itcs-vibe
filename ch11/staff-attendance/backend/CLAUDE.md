# backend 디렉토리 지침

## 기술스택

- Node.js + Express (JavaScript, TypeScript 아님)
- PostgreSQL(Supabase, `pg` 패키지로 커넥션 풀 직접 관리)
- 인증: JWT(자체 구현), bcrypt(비밀번호 해시)
- 테스트: jest + supertest

## 아키텍처

Clean 아키텍처, SOLID 준수. 상위 계층(usecases)은 하위 구현(infrastructure)에 직접 의존하지 않고 함수 주입(DIP)으로 연결한다.

```
src/
  config/          # env, DB 커넥션 풀 등 앱 조립에 필요한 설정
  domain/          # 엔티티, 리포지토리 인터페이스(JSDoc typedef)
  infrastructure/  # DB 접근 등 실제 구현체. withTransaction.js: 여러 리포지토리 호출을 하나의 DB 트랜잭션으로 묶는 헬퍼(각 리포지토리 함수는 옵션 client 인자를 받아 트랜잭션에 참여)
  usecases/        # 애플리케이션 로직. 리포지토리를 주입받아 사용
  controllers/     # req/res 처리, usecase 호출
  routes/          # 라우팅. /api/v1 하위에 마운트
  middlewares/     # 인증(authenticate), RBAC(requireRole), 에러 핸들러 등
  errors/          # AppError 및 서브클래스(BadRequestError 등)
  utils/           # JWT, 비밀번호 해시, 유효성 검사, snake_case↔camelCase 변환 등 공통 유틸
  app.js           # composition root: 의존성 조립, express 앱 export
  server.js        # 진입점(npm start), app.listen
```

## API 문서

`NODE_ENV`가 `production`이 아닐 때만 `/api-docs`에서 Swagger UI(`backend/swagger.yaml` 기반)를 제공한다. 운영 환경에서는 노출되지 않는다.

## 환경변수

`backend/.env`(커밋 금지, `.env.example` 참고)

| 변수                 | 설명                                  | 예시                                                   |
| -------------------- | ------------------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL 접속 문자열(필수)          | `postgresql://postgres:postgres@localhost:5432/postgres` |
| `PORT`                | 서버 포트(선택, 기본 3000)            | `3000`                                                   |
| `JWT_ACCESS_SECRET`   | Access Token 서명 비밀키(필수)        | -                                                         |
| `JWT_REFRESH_SECRET`  | Refresh Token 서명 비밀키(필수)       | -                                                         |
| `JWT_ACCESS_EXPIRES_IN`  | Access Token 유효기간(선택, 기본 `12h`) | `12h`                                                  |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 유효기간(선택, 기본 `7d`) | `7d`                                                   |
| `CORS_ORIGIN`         | 허용할 프론트엔드 Origin(선택, 기본 `http://localhost:5173`) | `http://localhost:5173`                |

## 인증방식

- JWT 기반 Access/Refresh Token. Access Token 유효기간 12시간, Refresh Token 7일.
- payload에 `userId`, `role` 포함.
- `Authorization: Bearer {token}` 헤더로 인증, 역할(role) 기반 접근 제어(RBAC: `manager`/`employee`).
- 비밀번호는 bcrypt로 해시하여 저장, 평문 저장 금지.
- 서버 측 Refresh Token 무효화(블랙리스트)는 1차 버전 범위 밖.
- 토큰 서명 비밀키는 `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` 환경변수로 관리(필수, 미설정 시 서버 기동 실패).
- 토큰 유효기간은 `JWT_ACCESS_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` 환경변수로 관리(선택, 기본 12h/7d).
