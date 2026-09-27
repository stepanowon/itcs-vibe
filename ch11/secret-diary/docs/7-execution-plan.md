# Execution Plan (Task 분할): 나만의 비밀일기 앱

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v2.1 |
| 작성일 | 2026-07-05 |
| 관련 문서 | [1-prd.md](./1-prd.md) · [2-erd.md](./2-erd.md) · [3-supabase-ddl.sql](./3-supabase-ddl.sql) · [4-swagger.json](./4-swagger.json) · [5-wireframe.md](./5-wireframe.md) · [6-user-story.md](./6-user-story.md) |

> 설계 산출물(PRD~User Story)을 **데이터베이스 → 백엔드 → 프론트엔드** 순서로,
> 관리 가능한 작은 단위의 **Task**로 분할한다.
> 각 Task는 **의존 Task(선행)**, **수행 작업(실행 단계)**, **체크박스 완료 조건**을 가진다.

## Task ID 규칙 및 범례

- `DB-xx` : 데이터베이스 영역 · `BE-xx` : 백엔드 영역 · `FE-xx` : 프론트엔드 영역
- **의존(선행)**: 이 Task를 시작하기 전에 완료되어야 하는 Task. `-` 는 선행 없음(즉시 착수 가능).
- **수행 작업**: 완료 조건을 충족하기 위해 실제로 진행하는 실행 단계.
- 완료 조건이 모두 체크되면 해당 Task는 **Done**.

---

## 1. 기술 스택 (요약)

| 계층 | 선택 |
| --- | --- |
| Database | Supabase PostgreSQL (`pg` 드라이버 직접 접속, ORM/RLS 미사용) |
| Backend | Node.js(LTS) + Express + JavaScript, Clean Architecture, `jsonwebtoken`, `bcrypt`, `zod` |
| Frontend | Vue 3 + Vite, Pinia, TanStack Query(Vue Query), Vue Router, Axios |

---

## 2. Phase 1 — 데이터베이스 (DB)

### DB-01. Supabase 프로젝트 생성 및 접속 정보 확보
- **의존(선행)**: `-`
- **수행 작업**
  1. Supabase 콘솔에서 프로젝트를 생성하고 리전을 확인한다.
  2. Connection Pooler 연결 문자열(host, port, db, user, password)을 복사한다.
  3. `backend/.env`에 `DB_CONN_STRING`으로 저장한다.
  4. 루트 `.gitignore`에 `.env`를 추가하여 저장소 커밋에서 제외한다.
- **완료 조건**
  - [x] Supabase 프로젝트가 생성되어 있다.
  - [x] DB 연결 문자열(host, port, db, user, password)을 확보했다.
  - [x] `.env`에 DB 접속 정보를 안전하게 보관하고 저장소에는 커밋하지 않는다(`.gitignore`).

### DB-02. ENUM 타입 생성
- **의존(선행)**: `DB-01`
- **수행 작업**
  1. `3-supabase-ddl.sql`의 ENUM 정의(값·순서)를 확인한다.
  2. 재실행 대비 `DROP TYPE IF EXISTS` 후 `weather_enum`, `mood_enum`을 생성한다.
  3. `pg_enum` 조회로 값과 정렬 순서가 DDL과 일치하는지 검증한다.
- **완료 조건**
  - [x] `weather_enum`(sunny/cloudy/rainy/snowy/windy)이 생성되었다.
  - [x] `mood_enum`(happy/neutral/sad/angry/excited/tired)이 생성되었다.
  - [x] `3-supabase-ddl.sql`의 ENUM 정의와 값이 정확히 일치한다.

### DB-03. `users` 테이블 생성
- **의존(선행)**: `DB-01`
- **수행 작업**
  1. `pgcrypto` 확장과 공통 `set_updated_at()` 트리거 함수를 생성한다.
  2. `users` 테이블을 PK/UNIQUE/CHECK 제약과 함께 생성한다.
  3. `trg_users_updated_at` 트리거를 연결한다.
  4. `information_schema`로 컬럼·제약·트리거를 검증한다.
- **완료 조건**
  - [x] PK `id`(uuid, `gen_random_uuid()`)가 설정되었다.
  - [x] `email`, `username` UNIQUE 제약이 적용되었다.
  - [x] `password_hash`, `created_at`, `updated_at` 컬럼이 존재한다.
  - [x] email 소문자 CHECK, username 길이 CHECK 제약이 적용되었다.
  - [x] `updated_at` 자동 갱신 트리거가 동작한다.

### DB-04. `refresh_tokens` 테이블 생성
- **의존(선행)**: `DB-03`
- **수행 작업**
  1. `refresh_tokens` 테이블을 FK(CASCADE)·UNIQUE(token_hash) 제약과 함께 생성한다.
  2. `idx_refresh_tokens_user_id`, `idx_refresh_tokens_expires_at` 인덱스를 생성한다.
  3. 제약·인덱스를 검증한다.
- **완료 조건**
  - [x] `user_id` FK(→users, `ON DELETE CASCADE`)가 설정되었다.
  - [x] `token_hash`(UNIQUE), `expires_at`, `revoked`(default false) 컬럼이 존재한다.
  - [x] `user_id`, `expires_at` 인덱스가 생성되었다.

### DB-05. `diaries` 테이블 생성
- **의존(선행)**: `DB-02`, `DB-03`
- **수행 작업**
  1. `diaries` 테이블을 FK(CASCADE), ENUM 컬럼(weather/mood), title 길이 CHECK와 함께 생성한다.
  2. `trg_diaries_updated_at` 트리거를 연결한다.
  3. 컬럼·ENUM 사용·트리거를 검증한다.
- **완료 조건**
  - [x] `user_id` FK(→users, CASCADE), `title`, `content`, `weather`, `mood`, 타임스탬프 컬럼이 존재한다.
  - [x] `weather`/`mood`가 각 ENUM 타입을 사용한다(NULL 허용).
  - [x] `title` 길이 CHECK 제약이 적용되었다.
  - [x] `updated_at` 트리거가 동작한다.

### DB-06. `tags` 테이블 생성
- **의존(선행)**: `DB-03`
- **수행 작업**
  1. `tags` 테이블을 FK(CASCADE), `UNIQUE(user_id, name)`, name 길이 CHECK와 함께 생성한다.
  2. 제약을 검증한다.
- **완료 조건**
  - [x] `user_id` FK(→users, CASCADE), `name`, `created_at` 컬럼이 존재한다.
  - [x] `UNIQUE(user_id, name)` 제약이 적용되었다.
  - [x] `name` 길이(1~20) CHECK 제약이 적용되었다.

### DB-07. `diary_tags` 연결 테이블 생성
- **의존(선행)**: `DB-05`, `DB-06`
- **수행 작업**
  1. `diary_tags` 테이블을 양쪽 FK(CASCADE)와 복합 PK로 생성한다.
  2. PK·FK 제약을 검증한다.
- **완료 조건**
  - [x] `diary_id`, `tag_id` FK(각 CASCADE)가 설정되었다.
  - [x] 복합 PK `(diary_id, tag_id)`가 적용되었다.

### DB-08. 조회/필터 인덱스 생성
- **의존(선행)**: `DB-05`, `DB-07`
- **수행 작업**
  1. `idx_diaries_user_created`(user_id, created_at DESC) 인덱스를 생성한다.
  2. `idx_diaries_user_weather`, `idx_diaries_user_mood` 부분 인덱스를 생성한다.
  3. `idx_diary_tags_tag` 인덱스를 생성한다.
  4. `pg_indexes` 조회로 인덱스 생성을 검증한다.
- **완료 조건**
  - [x] `diaries(user_id, created_at DESC)` 인덱스가 생성되었다.
  - [x] `diaries(user_id, weather)`, `diaries(user_id, mood)` 부분 인덱스가 생성되었다.
  - [x] `diary_tags(tag_id)` 인덱스가 생성되었다.

### DB-09. 스키마 반영 검증
- **의존(선행)**: `DB-04`, `DB-08`
- **수행 작업**
  1. `3-supabase-ddl.sql` 전체를 재실행하여 오류 없이 idempotent 하게 반영되는지 확인한다.
  2. user→diary→tag→diary_tag→refresh_token 순으로 샘플 INSERT를 수행한다.
  3. user DELETE로 FK CASCADE 동작을 확인하고 검증 데이터를 정리한다.
  4. 실행 계획 체크박스를 갱신한다.
- **완료 조건**
  - [x] `3-supabase-ddl.sql` 전체를 재실행해도 오류 없이 idempotent 하게 반영된다.
  - [x] 샘플 INSERT/SELECT로 5개 테이블·FK·CASCADE 동작을 확인했다.

---

## 3. Phase 2 — 백엔드 (BE)

### 2-1. 기반

### BE-01. 백엔드 프로젝트 부트스트랩
- **의존(선행)**: `-`
- **수행 작업**
  1. `npm init` 후 `express`, `morgan`, `dotenv`(런타임)와 `jest`, `supertest`(개발) 의존성을 설치한다.
  2. `domain/application/infrastructure/interfaces` 4계층 디렉터리를 생성한다.
  3. `infrastructure/config/env.js`(.env 로딩)와 `infrastructure/logging/logger.js`(기본 로깅)를 작성한다.
  4. `interfaces/http/app.js`와 `routes/health.route.js`(`GET /health`)를 작성한다.
  5. `server.js`로 앱을 기동하고 헬스체크·테스트로 검증한다.
- **완료 조건**
  - [x] Express 앱이 로컬에서 기동되고 헬스체크(`GET /health`)가 200을 반환한다.
  - [x] `2. 아키텍처`의 디렉터리 구조(domain/application/infrastructure/interfaces)가 생성되었다.
  - [x] `.env` 로딩(config)과 기본 로깅이 동작한다.

### BE-02. DB 커넥션 풀 연결
- **의존(선행)**: `BE-01`, `DB-09`
- **수행 작업**
  1. `pg` 드라이버를 설치한다.
  2. `infrastructure/db/pool.js`에서 `DB_CONN_STRING` 기반 커넥션 풀을 초기화한다.
  3. 앱 기동 시 `SELECT 1`로 연결 상태를 점검한다(부팅 로그 또는 헬스체크 확장).
  4. 프로세스 종료 시 풀을 정리(graceful shutdown)한다.
  5. 연결 성공/실패 케이스를 테스트한다.
- **완료 조건**
  - [x] `pg` 커넥션 풀이 초기화되고 앱 기동 시 DB 연결에 성공한다.
  - [x] 간단한 쿼리(`SELECT 1`)로 연결 상태를 확인한다.

### BE-03. 공통 미들웨어(에러 핸들러·검증)
- **의존(선행)**: `BE-01`
- **수행 작업**
  1. 도메인 에러 타입(`AppError` 등)과 표준 응답 포맷(`{code, message, details}`)을 정의한다.
  2. 중앙 `errorHandler` 미들웨어를 작성해 앱 마지막에 등록한다.
  3. `zod` 기반 검증 미들웨어(`validate`)를 작성해 400 + 필드 오류를 반환한다.
  4. 미정의 라우트 404 처리 미들웨어를 추가한다.
  5. 에러/검증/404 단위·통합 테스트를 작성한다.
- **완료 조건**
  - [x] 표준 에러 응답 포맷(`{code, message, details}`)을 반환하는 `errorHandler`가 있다.
  - [x] 입력 검증 미들웨어(`zod` 등)가 400 + 필드 오류를 반환한다.
  - [x] 정의되지 않은 라우트는 404를 반환한다.

### 2-2. 보안 유틸 & 인증

### BE-04. 비밀번호 해셔 & JWT 프로바이더
- **의존(선행)**: `BE-01`
- **수행 작업**
  1. `bcrypt`, `jsonwebtoken`을 설치한다.
  2. `BcryptHasher`(hash/compare)를 구현한다.
  3. `JwtProvider`로 Access(12h)·Refresh(7d) 토큰 발급/검증을 구현한다.
  4. 만료·위조 토큰 검증 시 예외를 던지도록 처리한다.
  5. 두 유틸의 단위 테스트를 작성한다.
- **완료 조건**
  - [x] `BcryptHasher`(hash/compare)가 단위 테스트로 검증된다.
  - [x] `JwtProvider`가 Access(12h)·Refresh(7d) 토큰을 발급/검증한다.
  - [x] 만료·위조 토큰 검증 시 오류를 반환한다.

### BE-05. User/RefreshToken 리포지토리
- **의존(선행)**: `BE-02`
- **수행 작업**
  1. `IUserRepository`, `IRefreshTokenRepository` 인터페이스를 정의한다.
  2. `PgUserRepository`를 구현한다(email/username 조회, 생성, 비밀번호 갱신).
  3. `PgRefreshTokenRepository`를 구현한다(저장, 조회, revoke).
  4. email 소문자 정규화를 저장/조회에 적용한다(DB CHECK 정합).
  5. 리포지토리 통합 테스트를 작성한다.
- **완료 조건**
  - [x] `IUserRepository` 인터페이스와 `PgUserRepository` 구현이 있다(email/username 조회, 생성, 비밀번호 갱신).
  - [x] `IRefreshTokenRepository` 구현이 있다(저장, 조회, revoke).
  - [x] email은 소문자로 정규화하여 저장/조회한다(DB CHECK 정합).

### BE-06. 회원가입 API — `POST /auth/signup`
- **의존(선행)**: `BE-03`, `BE-04`, `BE-05`
- **연관**: US-A1 · S-02
- **수행 작업**
  1. signup 입력 검증 스키마(zod: email/username/password)를 정의한다.
  2. `SignupUseCase`(중복 검사 → 비밀번호 해시 → 저장)를 구현한다.
  3. `POST /auth/signup` 컨트롤러·라우트를 연결한다.
  4. 201/409/400 응답 분기를 처리한다.
  5. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 유효 입력 시 201 + `UserProfile`(id 포함)을 반환한다.
  - [x] 비밀번호가 bcrypt 해시로 저장된다.
  - [x] email/username 중복 시 409를 반환한다.
  - [x] 형식 오류(email/username/password) 시 400 + 필드 메시지를 반환한다.

### BE-07. 로그인 API — `POST /auth/login`
- **의존(선행)**: `BE-05`, `BE-04`
- **연관**: US-A2 · S-01
- **수행 작업**
  1. login 입력 검증 스키마(식별자 + 비밀번호)를 정의한다.
  2. `LoginUseCase`(식별자 조회 → 비밀번호 검증 → 토큰 발급 → refresh 해시 저장)를 구현한다.
  3. `POST /auth/login` 라우트를 연결한다.
  4. 계정 없음/비밀번호 불일치를 동일 메시지의 401로 처리한다.
  5. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] email 또는 username + 비밀번호로 인증 성공 시 200 + Access/Refresh 토큰을 반환한다.
  - [x] Refresh Token이 해시로 DB에 저장된다.
  - [x] 계정 없음/비밀번호 불일치 모두 **동일 메시지**의 401을 반환한다.

### BE-08. 인증 가드 미들웨어(authGuard)
- **의존(선행)**: `BE-04`
- **연관**: 공통(NFR-3)
- **수행 작업**
  1. `authGuard` 미들웨어에서 `Authorization: Bearer` 토큰을 파싱한다.
  2. `JwtProvider`로 Access Token을 검증하고 `req.user`에 식별자를 주입한다.
  3. 토큰 없음/만료/위조 시 401을 반환한다.
  4. 단위 테스트를 작성한다.
- **완료 조건**
  - [x] `Authorization: Bearer` Access Token을 검증하고 `req.user`에 사용자 식별자를 주입한다.
  - [x] 토큰 없음/만료/위조 시 401을 반환한다.

### BE-09. 토큰 재발급 API — `POST /auth/refresh`
- **의존(선행)**: `BE-07`
- **연관**: US-A3
- **수행 작업**
  1. refresh 토큰 회전 정책을 확정한다(신규 Refresh 동시 발급 여부).
  2. `RefreshUseCase`(refresh 검증 → 새 Access 발급, 정책 반영)를 구현한다.
  3. `POST /auth/refresh` 라우트를 연결한다.
  4. 만료/폐기/위조/미존재 시 401을 처리한다.
  5. 통합 테스트로 `4-swagger.json` 정합을 확인한다.
- **완료 조건**
  - [x] 유효한 Refresh Token으로 새 Access Token을 반환한다.
  - [x] 만료/폐기/위조/미존재 Refresh Token 시 401을 반환한다.
  - [x] (정책 확정) 토큰 회전 채택 시 새 Refresh Token도 함께 발급하고 `4-swagger.json`과 일치시킨다.

### BE-10. 로그아웃 API — `POST /auth/logout`
- **의존(선행)**: `BE-08`, `BE-09`
- **연관**: US-A4
- **수행 작업**
  1. `LogoutUseCase`(대상 Refresh Token을 `revoked=true`로 무효화)를 구현한다.
  2. `POST /auth/logout` 라우트(authGuard)를 연결한다.
  3. 무효화 후 재발급 시도가 401이 되는지 확인하고 204를 반환한다.
  4. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 요청된 Refresh Token을 `revoked=true`로 무효화한다.
  - [x] 무효화된 토큰으로 재발급 시도 시 401을 반환한다.
  - [x] 204를 반환한다.

### 2-3. 일기 & 사용자

### BE-11. Diary/Tag 리포지토리
- **의존(선행)**: `BE-02`
- **수행 작업**
  1. `IDiaryRepository`, `ITagRepository` 인터페이스를 정의한다.
  2. `PgDiaryRepository`를 구현한다(생성/목록+필터/상세/수정/삭제, 모두 `user_id` 조건 포함).
  3. 태그 upsert 및 `diary_tags` 연결/해제 로직을 구현한다.
  4. 목록 조회에 `created_at DESC` 정렬과 페이지네이션을 적용한다.
  5. 리포지토리 통합 테스트를 작성한다.
- **완료 조건**
  - [x] `IDiaryRepository` 구현이 있다(생성/목록+필터/상세/수정/삭제, 모두 `user_id` 조건 포함).
  - [x] 태그 upsert 및 `diary_tags` 연결/해제 로직이 있다.
  - [x] 목록 조회가 `created_at DESC` + 페이지네이션을 지원한다.

### BE-12. 일기 작성 API — `POST /diaries`
- **의존(선행)**: `BE-08`, `BE-11`
- **연관**: US-B1 · S-04
- **수행 작업**
  1. 작성 입력 검증 스키마(제목/본문 필수, ENUM, 태그 10개/20자)를 정의한다.
  2. `CreateDiaryUseCase`(태그 upsert·연결 포함)를 구현한다.
  3. `POST /diaries` 라우트(authGuard)를 연결한다.
  4. 201/400/401 응답 분기를 처리한다.
  5. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 인증 사용자로 제목·본문(필수) + 날씨·기분·태그(선택)를 저장하고 201을 반환한다.
  - [x] 제목/본문 누락, ENUM 위반, 태그(10개/20자) 초과 시 400을 반환한다.
  - [x] 신규 태그는 사용자 태그 사전에 생성·연결되고 기존 태그는 재사용된다.
  - [x] 미인증 요청은 401을 반환한다.

### BE-13. 일기 목록 조회 API — `GET /diaries`
- **의존(선행)**: `BE-08`, `BE-11`
- **연관**: US-B2 · S-03
- **수행 작업**
  1. 목록 조회 쿼리 파라미터(page/limit)를 검증한다.
  2. `ListDiariesUseCase`(본인 일기 최신순 + total)를 구현한다.
  3. `GET /diaries` 라우트(authGuard)를 연결한다.
  4. 결과 없음 시 200 + 빈 배열을 반환한다.
  5. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 본인 일기만 최신순으로 반환한다.
  - [x] `page`/`limit` 페이지네이션과 total 정보를 반환한다.
  - [x] 결과 없음 시 200 + 빈 배열을 반환한다.

### BE-14. 일기 필터 조회 — `GET /diaries?weather=&mood=&tag=`
- **의존(선행)**: `BE-13`
- **연관**: US-B3 · S-03
- **수행 작업**
  1. weather/mood/tag 필터 파라미터를 검증한다.
  2. 리포지토리 목록 쿼리에 단일·복합(AND) 필터를 반영한다.
  3. 정의되지 않은 ENUM 등 잘못된 파라미터를 400으로 처리한다.
  4. 필터 조합 통합 테스트를 작성한다.
- **완료 조건**
  - [x] weather/mood/tag 단일 및 복합(AND) 필터가 정확히 반영된다.
  - [x] 정의되지 않은 ENUM 등 잘못된 파라미터 시 400을 반환한다.

### BE-15. 일기 상세 조회 — `GET /diaries/{id}`
- **의존(선행)**: `BE-08`, `BE-11`
- **연관**: US-B4 · S-05
- **수행 작업**
  1. `GetDiaryUseCase`(소유권 검증 + 태그 조인)를 구현한다.
  2. `GET /diaries/:id` 라우트(authGuard)를 연결한다.
  3. 200 / 타인 소유 403(또는 404) / 미존재 404를 처리한다.
  4. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 본인 소유 일기의 상세(태그 포함)를 200으로 반환한다.
  - [x] 타인 소유는 403(또는 404), 미존재는 404를 반환한다.

### BE-16. 일기 수정 API — `PUT /diaries/{id}`
- **의존(선행)**: `BE-15`
- **연관**: US-B5 · S-06
- **수행 작업**
  1. 수정 입력 검증 스키마를 정의한다.
  2. `UpdateDiaryUseCase`(소유권 확인 → 필드 수정 → 태그 재구성 → `updated_at` 갱신)를 구현한다.
  3. `PUT /diaries/:id` 라우트(authGuard)를 연결한다.
  4. 타인/미존재 403·404, 검증 실패 400을 처리한다.
  5. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 본인 소유 일기를 수정하고 `updated_at`이 갱신된다.
  - [x] 태그 변경 시 연결이 재구성된다.
  - [x] 타인/미존재 403·404, 검증 실패 400을 반환한다.

### BE-17. 일기 삭제 API — `DELETE /diaries/{id}`
- **의존(선행)**: `BE-15`
- **연관**: US-B6 · S-05
- **수행 작업**
  1. `DeleteDiaryUseCase`(소유권 확인, `diary_tags` CASCADE 제거)를 구현한다.
  2. `DELETE /diaries/:id` 라우트(authGuard)를 연결한다.
  3. 204 / 타인·미존재 403·404를 처리한다.
  4. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 본인 소유 일기를 삭제하고 `diary_tags` 연결이 함께 제거된다.
  - [x] 삭제 성공 시 204를 반환한다.
  - [x] 타인/미존재 시 403·404를 반환한다.

### BE-18. 내 정보 조회 API — `GET /users/me`
- **의존(선행)**: `BE-08`, `BE-11`
- **연관**: US-C1 · S-07
- **수행 작업**
  1. `GetMyProfileUseCase`(email/username/가입일 + 본인 `diaryCount` 집계)를 구현한다.
  2. `GET /users/me` 라우트(authGuard)를 연결한다.
  3. 미인증 시 401을 처리한다.
  4. 통합 테스트를 작성한다.
- **완료 조건**
  - [x] email·username·가입일과 본인 `diaryCount`를 반환한다.
  - [x] 미인증 시 401을 반환한다.

### BE-19. 비밀번호 변경 API — `PUT /users/me/password`
- **의존(선행)**: `BE-08`, `BE-05`
- **연관**: US-C2 · S-07
- **수행 작업**
  1. 비밀번호 변경 입력 검증 스키마(현재/신규 정책)를 정의한다.
  2. `ChangePasswordUseCase`(현재 비밀번호 확인 → 새 비밀번호 해시 갱신)를 구현한다.
  3. `PUT /users/me/password` 라우트(authGuard)를 연결한다.
  4. 성공 시 기존 Refresh Token을 무효화한다(P1).
  5. 204 / 현재 비번 불일치·정책 미달 400을 처리하고 통합 테스트를 작성한다.
- **완료 조건**
  - [x] 현재 비밀번호 확인 후 새 비밀번호를 해시로 갱신하고 204를 반환한다.
  - [x] 현재 비밀번호 불일치 또는 새 비밀번호 정책 미달 시 400을 반환한다.
  - [x] (P1) 변경 성공 시 기존 Refresh Token을 무효화한다.

### BE-20. 백엔드 통합 테스트
- **의존(선행)**: `BE-10`, `BE-12`, `BE-14`, `BE-16`, `BE-17`, `BE-18`, `BE-19`
- **수행 작업**
  1. 테스트용 DB 시드/픽스처와 격리 전략을 구성한다.
  2. 6-user-story의 P0 인수 조건을 Supertest 통합 시나리오로 작성한다.
  3. 보안 케이스(401/403/404/409) 자동 테스트를 추가한다.
  4. 실제 응답을 `4-swagger.json` 명세와 대조한다.
  5. 전체 그린 및 커버리지를 확인한다.
- **완료 조건**
  - [x] 6-user-story의 P0 인수 조건이 통합 테스트(Supertest)로 검증된다.
  - [x] 보안 케이스(401/403/404/409)가 자동 테스트로 커버된다.
  - [x] 실제 응답이 `4-swagger.json` 명세와 일치한다.

---

## 4. Phase 3 — 프론트엔드 (FE)

### 3-1. 기반

### FE-01. 프론트 프로젝트 부트스트랩
- **의존(선행)**: `-`
- **수행 작업**
  1. `npm create vite`로 Vue 3 앱을 부트스트랩한다.
  2. `pinia`, `@tanstack/vue-query`, `vue-router`, `axios`를 설치·등록한다.
  3. 프론트엔드 디렉터리 구조를 생성한다.
  4. 기본 라우팅 동작을 확인한다.
- **완료 조건**
  - [x] Vite+Vue3 앱이 기동되고 기본 라우팅이 동작한다.
  - [x] Pinia, Vue Query, Vue Router가 설치·등록되었다.
  - [x] `2. 프론트엔드 구조`의 디렉터리가 생성되었다.

### FE-02. API 클라이언트 & 인증 인터셉터
- **의존(선행)**: `FE-01`
- **수행 작업**
  1. Axios 인스턴스(baseURL, Access Token 자동 주입 인터셉터)를 작성한다.
  2. 401 응답 시 `POST /auth/refresh` 후 원요청을 재시도하는 로직을 구현한다.
  3. 동시 401 다발 시 refresh를 단일화(대기 큐)한다.
  4. Refresh 실패 시 세션을 비우고 로그인 화면으로 이동시킨다.
- **완료 조건**
  - [x] Axios 인스턴스가 baseURL·Access Token 자동 주입을 처리한다.
  - [x] 401 응답 시 `POST /auth/refresh`로 재발급 후 원요청을 재시도한다.
  - [x] 동시 401 다발 시 refresh를 단일화(대기 큐)한다.
  - [x] Refresh 실패 시 세션을 비운다(`auth:logout` 이벤트 → 인증 스토어 로그아웃). 실제 로그인 화면 "이동"은 `login` 라우트가 생기는 FE-05에서 라우트 가드(FE-03)를 통해 완성된다.

### FE-03. 인증 상태 스토어 & 라우트 가드
- **의존(선행)**: `FE-02`
- **수행 작업**
  1. Pinia auth 스토어(토큰·사용자 세션, 새로고침 후 유지)를 작성한다.
  2. 보호 라우트에 대해 미인증 시 로그인(S-01)으로 리다이렉트하는 가드를 등록한다.
  3. 로그인 상태에서 로그인/가입 접근 시 홈으로 리다이렉트한다.
- **완료 조건**
  - [x] Pinia auth 스토어가 토큰·사용자 세션을 관리한다(새로고침 후에도 유지).
  - [x] 보호 라우트는 미인증 시 로그인(S-01)으로 리다이렉트한다(`meta.requiresAuth` 가드 메커니즘 구현·테스트 완료. 실제 S-01~S-07 라우트는 FE-05~10에서 `meta` 부여와 함께 추가).
  - [x] 로그인 상태에서 로그인/가입 접근 시 홈으로 리다이렉트한다(`meta.guestOnly` 가드 메커니즘 구현·테스트 완료. 실제 로그인/가입 라우트는 FE-05~06에서 추가).

### FE-04. 공통 레이아웃(반응형 네비)
- **의존(선행)**: `FE-01`
- **연관**: 5-wireframe §2
- **수행 작업**
  1. 반응형 레이아웃 컴포넌트를 작성한다(모바일: 상단 앱바 + 하단 탭 바).
  2. ≥768px에서 상단 가로 네비로 전환한다.
  3. `safe-area-inset`과 44px 터치 타깃을 적용한다.
- **완료 조건**
  - [x] 모바일: 상단 앱바 + 하단 탭 바가 렌더된다.
  - [x] 태블릿/데스크톱(≥768px): 상단 가로 네비로 전환된다.
  - [x] 안전 영역(`safe-area-inset`)과 44px 터치 타깃이 적용된다.

### 3-2. 인증 화면

### FE-05. 로그인 화면 — S-01
- **의존(선행)**: `FE-03`, `BE-07`
- **연관**: US-A2
- **수행 작업**
  1. 로그인 폼(식별자·비밀번호) 화면을 작성한다.
  2. 로그인 뮤테이션을 연동하고 성공 시 홈(S-03)으로 이동한다.
  3. 401 시 "이메일 또는 비밀번호가 올바르지 않습니다"를 표시한다.
  4. 모바일 풀폭 / 데스크톱 중앙 카드 레이아웃을 적용한다.
- **완료 조건**
  - [x] 로그인 폼(식별자·비밀번호)으로 로그인 성공 시 홈(S-03)으로 이동한다.
  - [x] 401 시 "이메일 또는 비밀번호가 올바르지 않습니다"를 표시한다.
  - [x] 모바일 풀폭 / 데스크톱 중앙 카드 레이아웃이 적용된다.

### FE-06. 회원가입 화면 — S-02
- **의존(선행)**: `FE-03`, `BE-06`
- **연관**: US-A1
- **수행 작업**
  1. 가입 폼과 인라인 검증(형식·비밀번호 확인 일치)을 구현한다.
  2. signup 뮤테이션을 연동하고 중복(409) 안내를 표시한다.
  3. 가입 성공 시 로그인 화면으로 이동한다.
- **완료 조건**
  - [x] 가입 폼 검증(형식·비밀번호 확인 일치)이 인라인으로 동작한다.
  - [x] 중복(409) 시 안내 메시지를 표시한다.
  - [x] 가입 성공 시 로그인 화면으로 이동한다.

### 3-3. 일기 화면

### FE-07. 일기 목록 + 필터 화면 — S-03
- **의존(선행)**: `FE-04`, `BE-13`, `BE-14`
- **연관**: US-B2, US-B3
- **수행 작업**
  1. 일기 목록 카드(모바일 1열 / 데스크톱 그리드)를 렌더한다.
  2. 날씨·기분·태그 필터(모바일 칩+바텀시트)를 조회에 반영한다.
  3. 모바일 무한 스크롤 / 데스크톱 페이지네이션을 구현한다.
  4. 결과 0건 빈 상태 UI와 우하단 FAB(+)를 추가한다.
- **완료 조건**
  - [x] 본인 일기 목록이 카드로 렌더된다(모바일 1열 / 데스크톱 그리드).
  - [x] 날씨·기분·태그 필터(모바일 칩+바텀시트)가 조회에 반영된다.
  - [x] 모바일 무한 스크롤 / 데스크톱 페이지네이션이 동작한다.
  - [x] 결과 0건 시 빈 상태 UI를 표시한다.
  - [x] 우하단 FAB(+)로 작성 화면에 진입한다.

### FE-08. 일기 작성/수정 폼 — S-04 / S-06
- **의존(선행)**: `FE-07`, `BE-12`, `BE-16`
- **연관**: US-B1, US-B5
- **수행 작업**
  1. 제목·본문·날씨·기분·태그 입력 폼과 TagInput(최대 10/20자)을 구현한다.
  2. 필수 누락/검증 실패(400 연동)를 화면에 표시한다.
  3. 수정 화면에 기존 값을 프리필한다.
  4. 저장 성공 시 목록/상세로 이동하고 목록을 갱신한다.
- **완료 조건**
  - [x] 제목·본문·날씨·기분·태그 입력 폼과 TagInput(최대10/20자)이 동작한다.
  - [x] 필수 누락/검증 실패가 화면에 표시된다(400 연동).
  - [x] 수정 화면은 기존 값이 프리필된다.
  - [x] 저장 성공 시 목록/상세로 이동하고 목록이 갱신된다.

### FE-09. 일기 상세 + 삭제 — S-05
- **의존(선행)**: `FE-07`, `BE-15`, `BE-17`
- **연관**: US-B4, US-B6
- **수행 작업**
  1. 상세 내용(제목·본문·날씨·기분·태그·시각)을 렌더한다.
  2. 삭제 시 확인 모달로 이중 확인 후 삭제하고 목록으로 이동한다.
  3. 접근 불가(403/404) 시 안내 화면을 표시한다.
- **완료 조건**
  - [x] 상세 내용(제목·본문·날씨·기분·태그·시각)이 렌더된다.
  - [x] 삭제 시 확인 모달로 이중 확인 후 삭제하고 목록으로 이동한다.
  - [x] 접근 불가(403/404) 시 안내 화면을 표시한다.

### 3-4. 사용자 화면

### FE-10. 내 정보 + 비밀번호 변경 — S-07
- **의존(선행)**: `FE-04`, `BE-18`, `BE-19`, `BE-10`
- **연관**: US-C1, US-C2, US-A4
- **수행 작업**
  1. 프로필과 작성 일기 수(diaryCount)를 표시한다.
  2. 비밀번호 변경 폼(현재/신규/확인)을 구현하고 실패 시 오류를 표시한다.
  3. 로그아웃 시 Refresh 토큰을 무효화하고 로그인 화면으로 이동한다.
- **완료 조건**
  - [x] 프로필과 작성 일기 수(diaryCount)가 표시된다.
  - [x] 비밀번호 변경 폼(현재/신규/확인)이 동작하고 실패 시 오류를 표시한다.
  - [x] 로그아웃 시 Refresh 토큰 무효화 후 로그인 화면으로 이동한다.

### 3-5. 마무리

### FE-11. 공통 상태 UI(로딩·빈·에러)
- **의존(선행)**: `FE-07`, `FE-08`, `FE-09`, `FE-10`
- **연관**: PRD 8
- **수행 작업**
  1. 로딩 시 스켈레톤/스피너를 표시한다(Vue Query `isLoading`).
  2. 서버 오류(500) 시 전역 토스트를 표시한다.
  3. 각 화면의 빈 상태·에러 상태 UI를 일관되게 적용한다.
- **완료 조건**
  - [x] 로딩 시 스켈레톤/스피너가 표시된다(Vue Query `isLoading`).
  - [x] 서버 오류(500) 시 전역 토스트가 표시된다.
  - [x] 각 화면의 빈 상태·에러 상태 UI가 일관되게 적용된다.

### FE-12. 반응형 QA & 통합 점검
- **의존(선행)**: `FE-11`, `BE-20`
- **수행 작업**
  1. 모바일/태블릿/데스크톱 3개 브레이크포인트에서 레이아웃을 점검한다.
  2. 가입→로그인→작성→필터→수정→삭제→로그아웃 전체 플로우를 E2E로 점검한다.
  3. 가로 스크롤 발생·터치 타깃 미달 등 반응형 결함을 수정한다.
- **완료 조건**
  - [x] 모바일/태블릿/데스크톱 3개 브레이크포인트에서 레이아웃이 정상 동작한다.
  - [x] 가입→로그인→작성→필터→수정→삭제→로그아웃 전체 플로우가 통과한다.
  - [x] 가로 스크롤 발생·터치 타깃 미달 등 반응형 결함이 없다.

---

## 5. 의존 관계 요약

### 영역 간 흐름
```
[DB Phase] ─────────────▶ [BE Phase] ─────────────▶ [FE Phase]
 DB-01..09                 BE-01..20                 FE-01..12
     │                         │                         │
     └─ DB-09(스키마) ─▶ BE-02(DB풀) ─▶ 각 API ─▶ 대응 FE 화면
```
- FE-01~04(기반)은 백엔드와 **병렬 착수 가능**(대응 API 불필요).
- 각 FE 화면(FE-05~10)은 대응 BE API가 Done이어야 통합 완료.

### Task 의존 매트릭스 (선행 → 후행)

| Task | 선행(의존) |
| --- | --- |
| DB-01 | - |
| DB-02 | DB-01 |
| DB-03 | DB-01 |
| DB-04 | DB-03 |
| DB-05 | DB-02, DB-03 |
| DB-06 | DB-03 |
| DB-07 | DB-05, DB-06 |
| DB-08 | DB-05, DB-07 |
| DB-09 | DB-04, DB-08 |
| BE-01 | - |
| BE-02 | BE-01, DB-09 |
| BE-03 | BE-01 |
| BE-04 | BE-01 |
| BE-05 | BE-02 |
| BE-06 | BE-03, BE-04, BE-05 |
| BE-07 | BE-05, BE-04 |
| BE-08 | BE-04 |
| BE-09 | BE-07 |
| BE-10 | BE-08, BE-09 |
| BE-11 | BE-02 |
| BE-12 | BE-08, BE-11 |
| BE-13 | BE-08, BE-11 |
| BE-14 | BE-13 |
| BE-15 | BE-08, BE-11 |
| BE-16 | BE-15 |
| BE-17 | BE-15 |
| BE-18 | BE-08, BE-11 |
| BE-19 | BE-08, BE-05 |
| BE-20 | BE-10, BE-12, BE-14, BE-16, BE-17, BE-18, BE-19 |
| FE-01 | - |
| FE-02 | FE-01 |
| FE-03 | FE-02 |
| FE-04 | FE-01 |
| FE-05 | FE-03, BE-07 |
| FE-06 | FE-03, BE-06 |
| FE-07 | FE-04, BE-13, BE-14 |
| FE-08 | FE-07, BE-12, BE-16 |
| FE-09 | FE-07, BE-15, BE-17 |
| FE-10 | FE-04, BE-18, BE-19, BE-10 |
| FE-11 | FE-07, FE-08, FE-09, FE-10 |
| FE-12 | FE-11, BE-20 |

---

## 6. 완료 정의 (전체 Definition of Done)

- [x] DB-01~09 전 Task 완료(스키마·인덱스·CASCADE 검증).
- [x] BE-01~20 전 Task 완료(모든 P0 API가 Swagger 명세대로 응답, 보안 테스트 그린).
- [x] FE-01~12 전 Task 완료(전 화면 반응형·전체 플로우 통과).
- [x] 6-user-story의 모든 P0 인수 조건 충족. (`frontend/e2e/USER_STORY_E2E_REPORT.md` — Epic A/B/C 28개 AC 전수 검증, 28/28 PASS)
- [x] PRD 3.3 실패 조건에 해당하는 동작 0건. (타인 일기 접근 403/404, 미인증 작성 401, 비밀번호 bcrypt 해시, 폐기된 Refresh Token 401, 날씨/기분/태그 필터 정확도 — 모두 US-B/US-A E2E 검증 및 BE-20 통합 테스트로 확인)

---

## 7. 추가 기능 — 일기 작성 날짜 지정 (diary_date)

> MVP(DB-01~09/BE-01~20/FE-01~12) 완료 이후 추가된 기능. "어제 못 쓴 일기를 오늘 쓸 수 있도록" 일기가 다루는 날짜(`diary_date`)를 사용자가 직접 지정할 수 있게 한다.

- [x] DB: `diaries.diary_date date NOT NULL DEFAULT CURRENT_DATE` 컬럼 추가, 목록 정렬 인덱스를 `(user_id, diary_date DESC, created_at DESC)`로 변경.
- [x] BE: `diaryCreateSchema`/`diaryUpdateSchema`에 `diaryDate`(YYYY-MM-DD, optional) 추가, 생성 시 미지정이면 당일로 기본값 처리, 수정 시 `COALESCE`로 부분 갱신. `pg` DATE 타입 파서를 오버라이드하여 타임존에 의한 하루 밀림 버그를 방지(`backend/src/infrastructure/db/pool.js`).
- [x] BE 테스트: `diaries.integration.test.js`, `repositories.diary.test.js`에 diaryDate 관련 케이스 추가(미지정 시 당일 기본값, 과거 날짜 지정, 정렬 순서).
- [x] FE: 일기 작성/수정 폼에 "작성 날짜" 날짜 입력 필드 추가(`:max`로 미래 날짜 차단), 목록/상세 화면에 `diaryDate` 표시(`createdAt`/`updatedAt`은 감사용 시각으로 유지).
- [x] 문서: `docs/1-prd.md`(FR-2.1), `docs/2-erd.md`, `docs/3-supabase-ddl.sql`, `docs/6-user-story.md`(US-B1/B2/B4)에 diary_date 반영.
