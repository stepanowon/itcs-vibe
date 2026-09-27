# 백엔드 (secret-diary/backend)

## 스택
Node.js + Express + JavaScript. `pg` 드라이버로 Postgres(Supabase) 직접 접속(ORM 미사용).

## 아키텍처 (Clean Architecture, 4계층)
- `src/domain`: 에러 타입(`AppError` 등) 등 순수 도메인 요소
- `src/application`: Use Case (auth/diaries/users)
- `src/infrastructure`: config(env), db(pool), logging, repositories(Pg*), security(bcrypt/JWT)
- `src/interfaces/http`: app.js, routes, middlewares(authGuard/errorHandler/validate 등)

의존 방향은 항상 `interfaces → application → domain`, `infrastructure`는 인터페이스 구현체를 주입.

## 라우팅/인증
- API prefix `/api/v1` (`/health`만 예외), Swagger UI `/api-docs`(`docs/4-swagger.json` 서빙)
- JWT Access(기본 12h)/Refresh(기본 7d), 시크릿은 `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`로 분리, TTL은 `ACCESS_TOKEN_TTL_SECONDS`/`REFRESH_TOKEN_TTL_SECONDS`로 설정
- Refresh Token은 DB에 SHA-256 해시로 저장(`token_hash`), 회전(rotation) 정책 사용
- 모든 일기/태그 쿼리는 `user_id` 조건 필수(NFR-3, 소유권 강제) — 타인 리소스는 403/404

## 환경변수
`.env`(gitignore 대상, 커밋 금지) 필요: `DB_CONN_STRING`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `CORS_ORIGIN`. 템플릿은 `.env.example` 참고.

## 테스트
Jest + Supertest, **실제 Supabase DB 대상**(모킹 없음). 테스트 유저는 타임스탬프+랜덤 접미사로 격리하고 `afterAll`에서 정리(FK CASCADE로 연쇄 삭제). 커버리지 임계값 80%(`jest.config.js`, `src/server.js` 제외).

```
npm test              # 전체 테스트
npm run test:coverage # 커버리지 포함(있다면 package.json 확인)
```

## 참고 문서
`docs/1-prd.md`, `docs/2-erd.md`, `docs/3-supabase-ddl.sql`, `docs/4-swagger.json`, `docs/6-user-story.md`, `docs/7-execution-plan.md`(Task 진행 상태/완료 조건)
