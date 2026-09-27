# 소규모 사업장 근태관리 앱 실행계획

## 문서 변경 이력

| 버전 | 날짜       | 변경 내용 | 작성자 |
| ---- | ---------- | --------- | ------ |
| 0.1  | 2026-08-19 | 최초 작성 | -      |
| 0.2  | 2026-09-07 | 실제 구현과 정합성 검토 후 반영: 체크아웃 재클릭 정책, 반차(half_day) 지원(BE-12/FE-08/DB-04), 연차 발생 로직 단순화 범위 명확화, swagger.json→swagger.yaml 참조 수정, 로그인 실패 메시지 예시 정정 | -      |
| 0.3  | 2026-09-13 | 연차 발생 로직을 수동 배치 스크립트에서 전사 공통 연차 정책(leave_policy) 기반 자동계산으로 전면 교체(DB-07/BE-14/FE-12 신설), 체크아웃 유효 기간(오늘/어제) 제한, 트랜잭션 처리 확대(BE-05/BE-06/BE-10/BE-12) 반영 | -      |

## 개요

본 문서는 `1-prd.md`, `2-user-scenario.md`, `3-wireframe.md`, `4-erd.md`와 `backend/swagger.yaml`(OpenAPI 스펙, 18개 경로 / 21개 오퍼레이션)을 근거로 구현 실행계획을 정의한다.

작업은 **데이터베이스 → 백엔드 → 프론트엔드** 순서의 3개 티어로 나누고, 각 티어를 세부 Task로 분할한다.

- DB 티어: `4-erd.md`의 `users`/`attendances`/`leave_requests`/`leave_balances` 4개 테이블과 제약조건(UNIQUE/CHECK/FK) 기준으로 세분화
- 백엔드 티어: `1-prd.md` 5.2(Node.js+Express, Clean 아키텍처, SOLID)와 `backend/swagger.yaml`의 API 경로 기준으로, 공통 인프라 → 인증/미들웨어(JWT, RBAC) → 도메인별(회원가입, 로그인, 토큰재발급, 로그아웃, 사용자, 출퇴근, 연차, 연차잔여) 엔드포인트 순으로 세분화
- 프론트엔드 티어: `1-prd.md` 5.2(React, Tanstack Query, Zustand)와 `3-wireframe.md`의 10개 화면(반응형 포함) 기준으로, 공통 인프라 → 화면별 순으로 세분화

Task 번호는 티어 접두사(DB/BE/FE) + 2자리 일련번호(01, 02, ...)로 부여하며, 각 티어 내에서 선행 관계 순서대로 번호를 매긴다. P2(향후 검토) 항목은 Task로 만들지 않고 문서 맨 뒤 "향후 검토" 섹션에 목록만 남긴다.

---

## 1. DB 티어

DB 티어는 `4-erd.md` 2절의 테이블 스키마와 제약조건을 근거로, 확장/공통 함수 설정 → 테이블별 마이그레이션(FK 의존 순서: `users` → `attendances`/`leave_requests`/`leave_balances`) → 인덱스/시드데이터 순으로 세분화한다.

#### DB-01. 확장 설정 및 공통 함수/트리거

- 선행 Task: 없음

**수행 작업**

- Supabase PostgreSQL 프로젝트에 마이그레이션 관리 방식(SQL 마이그레이션 파일 디렉토리, 예: `db/migrations/`)을 확정한다.
- UUID 기본값 생성을 위한 `pgcrypto`(또는 `pgcrypto`의 `gen_random_uuid()`) 확장을 활성화한다.
- 모든 테이블 공통으로 사용할 `updated_at` 자동 갱신 트리거 함수(`set_updated_at()` 등)를 정의한다.
- 로컬/개발/운영 환경 접속 정보를 환경변수로 분리하는 규칙을 수립한다(DB 접속 문자열은 백엔드 `.env`에서 참조).

**작업 완료 조건**

- [x] `CREATE EXTENSION IF NOT EXISTS pgcrypto;` 마이그레이션이 적용되어 `gen_random_uuid()` 호출이 정상 동작한다.
- [x] `updated_at` 자동 갱신 트리거 함수가 생성되어 있고, 임의 테이블에 부착 시 UPDATE 시점에 `updated_at`이 갱신됨을 테스트로 확인한다.
- [x] 마이그레이션 파일이 버전 관리(순번 또는 타임스탬프 파일명)되어 순서대로 재실행 가능하다.

#### DB-02. `users` 테이블 마이그레이션

- 선행 Task: DB-01

**수행 작업**

- `4-erd.md` 2.1절 스키마대로 `users` 테이블을 생성한다: `id`(uuid PK, `gen_random_uuid()`), `email`(varchar(255) UNIQUE NOT NULL), `password_hash`(varchar(255) NOT NULL), `name`(varchar(100) NOT NULL), `employee_no`(varchar(50) UNIQUE NOT NULL), `hire_date`(date NOT NULL), `role`(varchar(20) NOT NULL, CHECK IN ('manager','employee')), `status`(varchar(20) NOT NULL DEFAULT 'active', CHECK IN ('active','inactive')), `created_at`/`updated_at`(timestamptz DEFAULT now()).
- `updated_at` 자동 갱신 트리거(DB-01)를 `users` 테이블에 부착한다.
- 최초 가입자만 `role='manager'`가 되는 규칙은 DB 제약으로 강제하지 않고 애플리케이션 트랜잭션 로직(백엔드 BE-06)에 위임함을 마이그레이션 주석으로 명시한다.

**작업 완료 조건**

- [x] `users` 테이블이 생성되고 `email`, `employee_no`에 각각 UNIQUE 제약이 존재함을 `\d users` 또는 정보 스키마 조회로 확인한다.
- [x] `role`에 `'manager'`/`'employee'` 이외 값 INSERT 시 CHECK 위반으로 실패한다.
- [x] `status`에 `'active'`/`'inactive'` 이외 값 INSERT 시 CHECK 위반으로 실패하고, 기본값이 `'active'`로 채워진다.
- [x] 동일 `employee_no`로 2건 INSERT 시 UNIQUE 위반(23505)이 발생한다.

#### DB-03. `attendances` 테이블 마이그레이션

- 선행 Task: DB-02

**수행 작업**

- `4-erd.md` 2.2절 스키마대로 `attendances` 테이블을 생성한다: `id`(uuid PK), `user_id`(uuid NOT NULL, FK → `users(id)`), `work_date`(date NOT NULL), `check_in_at`/`check_out_at`(timestamptz, NULL 허용), `created_at`/`updated_at`.
- `UNIQUE (user_id, work_date)` 제약을 추가해 하루 1회 출퇴근 원칙을 DB 레벨에서 강제한다.
- `CHECK (check_out_at IS NULL OR check_in_at IS NOT NULL)` — 체크인 없이 체크아웃 불가.
- `CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)` — 체크아웃은 체크인 이후 시각이어야 함.
- `user_id` FK에 `ON DELETE` 정책(예: RESTRICT, 계정 삭제 미지원이므로 기본 RESTRICT)을 명시한다.
- `updated_at` 트리거를 부착한다.

**작업 완료 조건**

- [x] 동일 `(user_id, work_date)` 조합으로 2건 INSERT 시 UNIQUE 위반이 발생한다.
- [x] `check_in_at`이 NULL인 레코드에 `check_out_at`만 채워 넣으면 CHECK 위반으로 실패한다.
- [x] `check_out_at < check_in_at`인 값으로 UPDATE 시 CHECK 위반으로 실패한다.
- [x] 존재하지 않는 `user_id`로 INSERT 시 FK 위반으로 실패한다.

#### DB-04. `leave_requests` 테이블 마이그레이션

- 선행 Task: DB-02

**수행 작업**

- `4-erd.md` 2.3절 스키마대로 `leave_requests` 테이블을 생성한다: `id`(uuid PK), `requester_id`(uuid NOT NULL, FK → `users(id)`), `start_date`/`end_date`(date NOT NULL), `days`(numeric(4,1) NOT NULL, CHECK > 0), `reason`(text NOT NULL), `status`(varchar(20) NOT NULL DEFAULT 'pending', CHECK IN ('pending','approved','rejected')), `processor_id`(uuid NULL, FK → `users(id)`), `processed_at`(timestamptz NULL), `created_at`/`updated_at`.
- `CHECK (end_date >= start_date)` 제약 추가.
- `CHECK (requester_id <> processor_id)` 제약 추가(자기 승인 방지, `processor_id`가 NULL인 대기중 상태에서는 자연히 만족).
- `CHECK ((status = 'pending' AND processor_id IS NULL AND processed_at IS NULL) OR (status IN ('approved','rejected') AND processor_id IS NOT NULL AND processed_at IS NOT NULL))` 상태-처리정보 정합성 제약 추가.
- 동일 기간 중복 연차 신청 방지(EXCLUDE 제약)는 1차 버전 범위 밖이므로 추가하지 않음을 주석으로 명시한다(`4-erd.md` 비고).
- `updated_at` 트리거를 부착한다.
- (추가, 2026-09-07) 반차(오전/오후) 지원을 위해 별도 마이그레이션(`db/migrations/0008_leave_requests_half_day.sql`)에서 `half_day`(varchar(2), CHECK IN ('am','pm')) 컬럼과 `CHECK (half_day IS NULL OR start_date = end_date)`, `CHECK (half_day IS NULL OR days = 0.5)` 제약을 추가했다(`4-erd.md` 2.3절 반영, BE-12/FE-08에서 사용).

**작업 완료 조건**

- [x] `start_date > end_date`로 INSERT 시 CHECK 위반으로 실패한다.
- [x] `requester_id`와 `processor_id`가 동일한 값으로 UPDATE 시 CHECK 위반으로 실패한다.
- [x] `status='pending'`인데 `processor_id`가 채워진 레코드를 INSERT/UPDATE하면 CHECK 위반으로 실패한다.
- [x] `status='approved'`인데 `processed_at`이 NULL인 레코드를 INSERT/UPDATE하면 CHECK 위반으로 실패한다.

#### DB-05. `leave_balances` 테이블 마이그레이션

- 선행 Task: DB-02

**수행 작업**

- `4-erd.md` 2.4절 스키마대로 `leave_balances` 테이블을 생성한다: `id`(uuid PK), `user_id`(uuid NOT NULL, FK → `users(id)`, UNIQUE — 1인당 1레코드), `total_days`(numeric(4,1) NOT NULL DEFAULT 0, CHECK >= 0), `used_days`(numeric(4,1) NOT NULL DEFAULT 0, CHECK >= 0), `remaining_days`(numeric(4,1) NOT NULL, `GENERATED ALWAYS AS (total_days - used_days) STORED`), `updated_at`(timestamptz DEFAULT now()).
- `CHECK (used_days <= total_days)` 제약을 추가해 잔여일수 음수화를 방지한다.
- 회원가입(BE-06) 시 사용자 1건 생성과 함께 `leave_balances` 1건이 초기화(`total_days=0`)되도록 백엔드에서 처리함을 마이그레이션 주석에 남긴다.

**작업 완료 조건**

- [x] 동일 `user_id`로 2건 INSERT 시 UNIQUE 위반이 발생한다.
- [x] `used_days`를 `total_days`보다 크게 UPDATE 시 CHECK 위반으로 실패한다.
- [x] `total_days`/`used_days`를 변경하면 `remaining_days`가 별도 UPDATE 없이 자동 재계산됨을 확인한다.
- [x] `remaining_days` 컬럼에 직접 INSERT/UPDATE를 시도하면 GENERATED 컬럼 오류로 거부된다.

#### DB-06. 인덱스 및 시드 데이터

- 선행 Task: DB-03, DB-04, DB-05

**수행 작업**

- 조회 성능을 위한 인덱스를 추가한다: `attendances(user_id, work_date)`(UNIQUE 제약이 이미 인덱스 역할을 하므로 월별 조회용 `work_date` 인덱스 별도 검토), `leave_requests(status)`, `leave_requests(requester_id)`, `leave_requests(processor_id)`.
- 로컬 개발/QA용 시드 데이터 스크립트를 작성한다: manager 2명(박팀장, 이팀장 — 2-user-scenario.md 시나리오4 "본인 신청 건은 다른 manager만 승인 가능" 검증에 필요), employee 다수(김사원 등), 각 사용자별 `leave_balances` 초기값, 샘플 `attendances`/`leave_requests` 레코드.
- 시드 데이터는 반복 실행 가능하도록(idempotent, `ON CONFLICT DO NOTHING` 등) 작성한다.

**작업 완료 조건**

- [x] `leave_requests(status)`, `leave_requests(requester_id)`, `leave_requests(processor_id)` 인덱스가 생성되어 있음을 확인한다.
- [x] 시드 스크립트 실행 후 manager 2명 이상, employee 2명 이상, 각 사용자 `leave_balances` 레코드가 존재한다.
- [x] 시드 스크립트를 2회 연속 실행해도 UNIQUE 위반 없이 정상 종료된다.

#### DB-07. `leave_policy` 테이블 마이그레이션

- 선행 Task: DB-01

**수행 작업**

- `4-erd.md` 2.5절 스키마대로 `leave_policy` 테이블(단일 행 설정)을 생성한다: `id`(integer PK, DEFAULT 1, CHECK id=1), `base_days`(numeric(4,1) NOT NULL DEFAULT 0, CHECK >= 0), `updated_at`.
- `updated_at` 자동 갱신 트리거(DB-01)를 부착한다.
- 최초 1행(`base_days=0`)을 `ON CONFLICT DO NOTHING`으로 삽입해 애플리케이션이 항상 1건을 조회할 수 있도록 보장한다.

**작업 완료 조건**

- [x] `leave_policy` 테이블에 정확히 1건(`id=1`)만 존재하며, 2번째 행 INSERT 시 PK 위반으로 실패한다.
- [x] `base_days`에 음수 UPDATE 시 CHECK 위반으로 실패한다.
- [x] 마이그레이션을 재실행해도 기존 행이 중복 생성되지 않는다(idempotent).

### DB 티어 Task 목록

| 번호  | 제목                                 | 선행 Task           |
| ----- | ------------------------------------ | ------------------- |
| DB-01 | 확장 설정 및 공통 함수/트리거        | 없음                |
| DB-02 | `users` 테이블 마이그레이션          | DB-01               |
| DB-03 | `attendances` 테이블 마이그레이션    | DB-02               |
| DB-04 | `leave_requests` 테이블 마이그레이션 | DB-02               |
| DB-05 | `leave_balances` 테이블 마이그레이션 | DB-02               |
| DB-06 | 인덱스 및 시드 데이터                | DB-03, DB-04, DB-05 |
| DB-07 | `leave_policy` 테이블 마이그레이션   | DB-01               |

---

## 2. 백엔드 티어

백엔드 티어는 `1-prd.md` 5.2(Node.js + Express, Clean 아키텍처, SOLID)를 근거로 프로젝트 골격/공통 인프라 → 인증 미들웨어(JWT/RBAC) → 도메인 모델/리포지토리 계층 → `backend/swagger.yaml`의 9개 도메인(회원가입, 로그인, 토큰재발급, 로그아웃, 사용자, 출퇴근, 연차, 연차잔여, 연차정책) 엔드포인트 구현 순으로 세분화한다. swagger.yaml은 18개 경로, 21개 오퍼레이션으로 구성되어 있으며 아래 도메인 Task들이 이를 모두 커버한다.

#### BE-01. 프로젝트 초기 설정 및 Clean 아키텍처 골격

- 선행 Task: 없음

**수행 작업**

- Node.js + Express 프로젝트를 초기화하고 Clean 아키텍처 레이어 디렉토리 구조를 구성한다: `routes`(인터페이스/라우팅), `controllers`, `usecases`(애플리케이션 로직), `domain`(엔티티/리포지토리 인터페이스), `infrastructure`(DB 접근, 외부 연동), `config`.
- Supabase PostgreSQL 접속을 위한 커넥션 풀(`pg` 패키지 등)을 `config`/`infrastructure`에 구성하고 환경변수(`.env`)로 접속 정보를 분리한다.
- `/api/v1` 베이스 경로, JSON 파서, CORS 설정 등 Express 앱 기본 설정을 완료한다.
- SOLID 원칙에 따라 상위 계층(usecases)이 하위 구현(infrastructure)에 직접 의존하지 않도록 의존성 방향을 리포지토리 인터페이스 기반으로 설계한다.

**작업 완료 조건**

- [x] `npm start`(또는 동등 명령)로 서버가 기동되고 헬스체크 엔드포인트가 200을 반환한다.
- [x] DB 커넥션 풀이 DB-01~DB-06 완료된 데이터베이스에 정상 접속됨을 확인한다.
- [x] 디렉토리 구조가 routes/controllers/usecases/domain/infrastructure로 분리되어 있다.

#### BE-02. 공통 미들웨어 - 에러 핸들링 및 응답 포맷

- 선행 Task: BE-01

**수행 작업**

- `swagger.yaml`의 `ErrorResponse` 스키마(`code`, `message`)에 맞춘 공통 에러 응답 포맷을 정의한다.
- 커스텀 에러 클래스(예: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`)와 이를 HTTP 상태코드(400/401/403/404/409)로 변환하는 Express 전역 에러 핸들러를 구현한다.
- 요청 유효성 검증(필수 필드, 날짜 형식 `YYYY-MM`/`YYYY-MM-DD` 등) 공통 유틸을 구현한다.

**작업 완료 조건**

- [x] 임의 라우트에서 커스텀 에러를 throw하면 전역 에러 핸들러가 `{code, message}` 형식으로 알맞은 상태코드를 응답한다.
- [x] 처리되지 않은 예외(500)도 동일한 응답 포맷으로 반환되며 서버가 다운되지 않는다.
- [x] 필수 필드 누락 요청에 대해 400 + `BadRequest` 응답이 반환되는 단위 테스트가 통과한다.

#### BE-03. 인증 미들웨어 - JWT 발급/검증 및 RBAC

- 선행 Task: BE-01

**수행 작업**

- JWT 서명/검증 유틸을 구현한다: Access Token(유효기간 12시간), Refresh Token(유효기간 7일), payload에 `userId`, `role` 포함.
- 비밀번호 해시 유틸(bcrypt 등)을 구현한다.
- `Authorization: Bearer {token}` 헤더를 검증해 `req.user`를 채우는 인증 미들웨어를 구현하고, 토큰 만료/위조 시 401을 반환한다.
- 역할(role) 기반 접근 제어를 위한 RBAC 미들웨어(`requireRole('manager')` 등)를 구현한다.
- 비활성(`status='inactive'`) 계정에 대한 접근 차단 로직(로그인 시 403 등)을 재사용 가능한 형태로 준비한다(로그인 도메인 BE-07에서 사용).

**작업 완료 조건**

- [x] 유효한 토큰으로 보호된 임시 라우트 호출 시 `req.user`가 채워지고 200이 반환된다.
- [x] 만료되었거나 서명이 다른 토큰으로 호출 시 401이 반환된다.
- [x] `requireRole('manager')`가 적용된 라우트에 employee 토큰으로 접근 시 403이 반환된다.
- [x] 비밀번호 해시/검증 유틸의 왕복(hash → compare) 단위 테스트가 통과한다.

#### BE-04. 도메인 모델 및 리포지토리 인터페이스 정의

- 선행 Task: BE-01

**수행 작업**

- `4-erd.md` 4개 테이블에 대응하는 도메인 엔티티(User, Attendance, LeaveRequest, LeaveBalance)를 `domain` 계층에 정의한다.
- 각 엔티티에 대한 리포지토리 인터페이스(예: `UserRepository`, `AttendanceRepository`, `LeaveRequestRepository`, `LeaveBalanceRepository`)를 정의한다(SOLID의 DIP·ISP 준수: usecases는 인터페이스에만 의존).
- 인터페이스 메서드는 이후 도메인 엔드포인트 구현(BE-06~BE-13)에서 필요한 조회/생성/갱신 시그니처(예: `findByEmployeeNo`, `findByUserIdAndWorkDate`, `countByRole` 등)를 포함한다.

**작업 완료 조건**

- [x] 4개 도메인 엔티티 클래스/타입이 정의되어 있고 `4-erd.md` 컬럼과 1:1로 매핑된다.
- [x] 4개 리포지토리 인터페이스가 정의되어 있고 구현체 없이도 usecases 레이어가 컴파일/로드 가능하다(인터페이스만으로 목(mock) 대체 가능함을 확인).

#### BE-05. Repository 구현체 (Postgres)

- 선행 Task: BE-04, DB-06

**수행 작업**

- BE-04에서 정의한 4개 리포지토리 인터페이스에 대한 Postgres 구현체를 `infrastructure` 계층에 작성한다.
- `UserRepository`: 이메일/사번으로 조회, role='manager' 카운트(최초 가입자 판별용), 사용자 생성.
- `AttendanceRepository`: `user_id`+`work_date`로 단건 조회, 체크인 생성, 체크아웃 업데이트, 월별 목록 조회(본인/전체).
- `LeaveRequestRepository`: 생성, 상태별 목록 조회(전체/본인), 단건 조회 및 상태 조건부 UPDATE(`WHERE status='pending'`).
- `LeaveBalanceRepository`: `user_id`로 단건 조회, `total_days`/`used_days` 증감 UPDATE.
- 사용자/연차잔여 생성은 트랜잭션으로 묶어 최초 가입자 판별(PRD 8, 동시 가입 대응)의 정합성을 보장한다.

**작업 완료 조건**

- [x] 4개 리포지토리 구현체 각각에 대한 통합 테스트(실제 DB 또는 테스트 DB)가 CRUD 기본 동작을 검증하고 통과한다.
- [x] 동시에 2개의 요청이 최초 가입을 시도하는 상황을 시뮬레이션했을 때 manager가 1명만 생성됨을 확인한다(트랜잭션/행 잠금 검증).
- [x] `leave_requests` 상태 조건부 UPDATE가 이미 처리된 건에는 0 rows affected를 반환함을 확인한다.

#### BE-06. 회원가입 (Auth: signup)

- 선행 Task: BE-02, BE-03, BE-05

**수행 작업**

- `POST /auth/signup`을 구현한다: email/이름/사번/입사일/비밀번호를 입력받아 `SignupRequest` 스키마로 검증한다.
- 사번 중복 시 409 + `DUPLICATE_EMPLOYEE_NO` 에러를 반환한다.
- `users` 테이블에 role='manager' 레코드가 0건인지 트랜잭션 내에서 확인해 최초 가입자는 manager, 이후는 employee로 등록한다(PRD 8).
- 비밀번호는 해시하여 저장하고, 가입과 동시에 `leave_balances` 레코드(초기 `total_days=0`)를 생성한다.
- 성공 시 201 + `User` 스키마(비밀번호 제외) 응답.

**작업 완료 조건**

- [x] 최초 가입 요청 시 응답의 `role`이 `manager`로 반환된다.
- [x] 두 번째 이후 가입 요청 시 응답의 `role`이 `employee`로 반환된다.
- [x] 동일 사번으로 재가입 시도 시 409 응답과 `DUPLICATE_EMPLOYEE_NO` 코드가 반환된다.
- [x] 가입 성공 시 DB에 해시된 비밀번호(평문 아님)와 `leave_balances` 레코드가 함께 생성된다.

#### BE-07. 로그인 (Auth: login)

- 선행 Task: BE-02, BE-03, BE-05

**수행 작업**

- `POST /auth/login`을 구현한다: 이메일/비밀번호 검증 후 실패 시 401(계정 존재 여부는 노출하지 않는 공통 메시지).
- `status='inactive'` 계정은 403을 반환한다(PRD 8 엣지 케이스).
- 인증 성공 시 Access Token(12시간)/Refresh Token(7일)을 발급해 `TokenResponse` 스키마로 응답한다.

**작업 완료 조건**

- [x] 올바른 이메일/비밀번호로 로그인 시 `accessToken`/`refreshToken`/`expiresIn`(43200)이 포함된 200 응답을 받는다.
- [x] 잘못된 비밀번호로 로그인 시 401이 반환되고 "이메일 또는 비밀번호가 올바르지 않습니다"처럼 계정 존재 여부를 노출하지 않는 공통 에러 메시지가 표시된다.
- [x] `status='inactive'` 계정으로 로그인 시 403이 반환된다.

#### BE-08. 토큰 재발급 (Auth: refresh)

- 선행 Task: BE-02, BE-03, BE-07

**수행 작업**

- `POST /auth/refresh`를 구현한다: 유효한 Refresh Token으로 신규 Access Token(및 필요 시 Refresh Token)을 재발급한다.
- Refresh Token이 만료/위조된 경우 401을 반환해 클라이언트가 재로그인하도록 유도한다(PRD 8 엣지 케이스).

**작업 완료 조건**

- [x] 유효한 Refresh Token으로 요청 시 새 `TokenResponse`가 200으로 반환된다.
- [x] 만료된 Refresh Token으로 요청 시 401이 반환된다.
- [x] 위조된(서명 불일치) Refresh Token으로 요청 시 401이 반환된다.

#### BE-09. 로그아웃 (Auth: logout)

- 선행 Task: BE-02, BE-03

**수행 작업**

- `POST /auth/logout`을 구현한다: 인증된 사용자 요청에 대해 204(본문 없음)를 반환한다.
- 서버 측 Refresh Token 무효화(블랙리스트)는 1차 버전 범위 밖임을 코드 주석/문서에 명시한다(PRD 5.2).

**작업 완료 조건**

- [x] 유효한 Access Token으로 호출 시 204가 반환된다.
- [x] 토큰 없이 호출 시 401이 반환된다.

#### BE-10. 사용자 (Users)

- 선행 Task: BE-02, BE-03, BE-05, BE-06

**수행 작업**

- `GET /users/me`: 로그인 사용자 본인 정보를 `User` 스키마로 반환한다.
- `PATCH /users/me/password`: `ChangePasswordRequest`(현재/새 비밀번호)를 받아 현재 비밀번호 일치 확인 후 해시하여 저장, 신규 토큰(`TokenResponse`)을 재발급한다. 불일치 시 400.
- `POST /users`: `CreateManagerRequest`로 manager 전용 신규 manager 계정 생성(사번 중복 검사는 BE-06과 동일 로직 재사용). manager 이외 접근 시 403, 사번 중복 시 409.
- `GET /users`: manager 전용 전체 사용자 목록(`User[]`) 조회. employee 접근 시 403.

**작업 완료 조건**

- [x] 인증된 사용자가 `GET /users/me` 호출 시 본인 정보만 반환된다.
- [x] 현재 비밀번호를 틀리게 입력하고 비밀번호 변경 요청 시 400이 반환되고 비밀번호는 변경되지 않는다.
- [x] 올바른 현재 비밀번호로 변경 요청 시 200과 함께 신규 토큰이 반환되고, 신규 토큰으로 API 호출이 가능하다.
- [x] employee 계정으로 `POST /users`, `GET /users` 호출 시 각각 403이 반환된다.
- [x] manager 계정으로 신규 manager 계정 생성 시 201과 `role='manager'` 응답을 받고, 사번 중복 시 409가 반환된다.

#### BE-11. 출퇴근 (Attendances)

- 선행 Task: BE-02, BE-03, BE-05

**수행 작업**

- `POST /attendances/check-in`: 서버 시각(KST) 기준으로 당일(`work_date`) 체크인 레코드를 생성한다. 이미 당일 체크인 기록이 있으면 409.
- `POST /attendances/check-out`: 사용자의 가장 최근 근무 기록(체크아웃 여부 무관)을 찾아 체크아웃 시각을 기록(UPDATE)한다. 단, 그 기록의 `work_date`가 오늘 또는 어제(KST)가 아니면(기록 자체가 없는 경우 포함) 체크인 기록이 없는 것으로 간주해 400 — 오래된 근무일이 실수로 덮어써지는 것을 방지한다. 자정을 넘겨도 체크인일의 `work_date`에 귀속시킨다. 체크인과 달리 여러 번 호출 가능하며, 매번 최종 호출 시각으로 `checkOutAt`을 덮어쓴다.
- `GET /attendances/me`: `month`(YYYY-MM) 쿼리로 본인의 월별 출퇴근 목록을 조회한다.
- `GET /attendances`: manager 전용, `month`(필수)+`userId`(선택) 쿼리로 전체/개별 직원의 월별 출퇴근 목록을 조회한다. employee 접근 시 403.

**작업 완료 조건**

- [x] 당일 최초 체크인 시 201과 `checkInAt`이 채워진 `Attendance`가 반환된다.
- [x] 당일 재차 체크인 시도 시 409가 반환된다.
- [x] 체크인 없이 체크아웃 시도 시 400이 반환된다.
- [x] 가장 최근 근무 기록이 오늘/어제(KST)가 아닌(오래전) 경우에도 체크인 없음과 동일하게 400이 반환되고, 해당 오래된 기록은 갱신되지 않는다.
- [x] 체크인 후 체크아웃 시 200과 `checkOutAt`이 채워진 `Attendance`가 반환된다.
- [x] 체크아웃을 여러 번 호출하면 같은 레코드의 `checkOutAt`이 최종 호출 시각으로 갱신된다.
- [x] employee 계정으로 `GET /attendances`(전체 조회) 호출 시 403이 반환된다.
- [x] `GET /attendances/me?month=YYYY-MM` 호출 시 해당 월 기록만 반환된다.

#### BE-12. 연차 (LeaveRequests)

- 선행 Task: BE-02, BE-03, BE-05

**수행 작업**

- `POST /leave-requests`: employee/manager 공통으로 본인 명의 연차를 신청한다. `start_date > end_date`이면 400, 신청 일수가 `leave_balances.remaining_days`를 초과하면 400("잔여 연차일수가 부족합니다"). `halfDay`('am'|'pm') 지정 시 0.5일 반차로 처리하며, 이때 `start_date`와 `end_date`가 다르면 400.
- `GET /leave-requests`: manager 전용, `status` 쿼리(선택)로 전체 연차 신청 목록 조회. employee 접근 시 403.
- `GET /leave-requests/me`: 본인이 신청한 연차 신청 내역 조회.
- `PATCH /leave-requests/{id}/approve`: `status='pending'`인 건만 승인 처리, 처리자/처리시각 기록, `leave_balances.used_days` 차감(증가). 신청자 본인이 처리자와 같으면 403. 이미 처리된 건이면 409. 대상 없음 404. 상태변경+사용일수 차감은 하나의 DB 트랜잭션(`withTransaction`)으로 묶어, `used_days<=total_days` CHECK 위반 시 400("잔여 연차일수가 부족합니다")으로 응답하고 상태변경도 함께 롤백한다.
- `PATCH /leave-requests/{id}/reject`: 승인과 동일한 검증(본인 처리 금지 403, 재처리 409, 404) 하에 반려 처리.

**작업 완료 조건**

- [x] 시작일이 종료일보다 늦은 신청은 400이 반환되고 레코드가 생성되지 않는다.
- [x] 잔여 연차일수를 초과하는 신청은 400이 반환되고 레코드가 생성되지 않는다.
- [x] 정상 신청 시 201과 `status='pending'`인 `LeaveRequest`가 반환된다.
- [x] manager 본인이 자신의 신청 건을 승인/반려 시도 시 403이 반환된다.
- [x] 다른 manager가 승인 처리 시 200과 함께 `status='approved'`, `processorId`, `processedAt`이 채워지고 신청자의 `leave_balances.used_days`가 증가한다.
- [x] 이미 처리된 건을 재차 승인/반려 시도 시 409가 반환된다.
- [x] employee 계정으로 `GET /leave-requests`(전체 조회) 호출 시 403이 반환된다.
- [x] `halfDay='am'`으로 신청 시 201과 함께 `days=0.5`, `halfDay='am'`인 `LeaveRequest`가 반환된다.
- [x] 반차인데 시작일과 종료일이 다르면 400이 반환된다.

#### BE-13. 연차 잔여 (LeaveBalances) 조회

- 선행 Task: BE-02, BE-03, BE-05

**수행 작업**

- `GET /leave-balances/me`: 본인의 `LeaveBalance`(총 부여일수/사용일수/잔여일수)를 조회한다.
- `GET /leave-balances`: manager 전용, 전체 사용자의 연차 잔여현황(사번/이름/총/사용/잔여일수)을 조회한다. employee 접근 시 403.
- `total_days`의 산정 자체는 BE-14(연차 정책)에서 다룬다. 본 Task는 조회 API만을 범위로 한다.

**작업 완료 조건**

- [x] `GET /leave-balances/me` 호출 시 `totalDays`/`usedDays`/`remainingDays`가 포함된 200 응답을 받는다.
- [x] `remaining_days`는 GENERATED 컬럼이므로 별도 코드 없이 자동 반영됨을 확인한다.
- [x] manager 계정으로 `GET /leave-balances` 호출 시 전체 사용자 목록이 반환된다.
- [x] employee 계정으로 `GET /leave-balances` 호출 시 403이 반환된다.

#### BE-14. 연차 정책 (LeavePolicy) 및 연차 발생 로직

- 선행 Task: BE-02, BE-03, BE-05, DB-07

**수행 작업**

- (2026-09-13 재설계) 당초 계획했던 "관리자가 수동 배치 스크립트를 실행"하는 방식(구 BE-13)은 폐기하고, 전사 공통 연차 정책(`leave_policy.base_days`)과 입사연도 기준 자동계산 방식으로 교체했다. 수동 스크립트(`backend/scripts/accrueLeave.js`)는 삭제되었다.
- `GET /leave-policy`: manager 전용, 공통 기본 연차일수(`baseDays`)를 조회한다.
- `PATCH /leave-policy`: manager 전용, `baseDays`를 변경한다. 저장과 동시에 전체 사용자의 `total_days`를 하나의 트랜잭션(`withTransaction`) 안에서 재계산한다: 해당연도(올해) 입사자는 0일, 전년도 입사자는 `baseDays` 그대로, 그 이전 입사자는 `baseDays+(지난 햇수-1)`(`utils/leaveAccrual.js`의 `calcTotalDays`). `used_days`는 그대로 유지되며, 재계산 중 `used_days<=total_days` CHECK 위반이 나면 전체 롤백 후 400(`INVALID_TOTAL_DAYS`)을 반환한다.
- 회원가입(BE-06)과 관리자 계정 생성(BE-10) 시점에도 동일한 `calcTotalDays` 공식으로 초기 `total_days`를 계산해 부여한다.

**작업 완료 조건**

- [x] `GET /leave-policy` 호출 시 `baseDays`가 포함된 200 응답을 받는다. employee 접근 시 403.
- [x] `PATCH /leave-policy`로 `baseDays`를 변경하면 200과 함께 전체 사용자의 `leave_balances.total_days`가 새 규칙대로 즉시 재계산됨을 확인한다(사용일수는 유지).
- [x] 올해 입사한 사용자가 가입하면 `total_days=0`으로 생성된다.
- [x] 전년도 입사자는 `total_days=baseDays`, 그 이전 입사자는 `baseDays+(지난 햇수-1)`로 계산됨을 확인한다.
- [x] employee 계정으로 `PATCH /leave-policy` 호출 시 403이 반환된다.

### 백엔드 티어 Task 목록

| 번호  | 제목                                        | 선행 Task                  |
| ----- | ------------------------------------------- | -------------------------- |
| BE-01 | 프로젝트 초기 설정 및 Clean 아키텍처 골격   | 없음                       |
| BE-02 | 공통 미들웨어 - 에러 핸들링 및 응답 포맷    | BE-01                      |
| BE-03 | 인증 미들웨어 - JWT 발급/검증 및 RBAC       | BE-01                      |
| BE-04 | 도메인 모델 및 리포지토리 인터페이스 정의   | BE-01                      |
| BE-05 | Repository 구현체 (Postgres)                | BE-04, DB-06               |
| BE-06 | 회원가입 (Auth: signup)                     | BE-02, BE-03, BE-05        |
| BE-07 | 로그인 (Auth: login)                        | BE-02, BE-03, BE-05        |
| BE-08 | 토큰 재발급 (Auth: refresh)                 | BE-02, BE-03, BE-07        |
| BE-09 | 로그아웃 (Auth: logout)                     | BE-02, BE-03               |
| BE-10 | 사용자 (Users)                              | BE-02, BE-03, BE-05, BE-06 |
| BE-11 | 출퇴근 (Attendances)                        | BE-02, BE-03, BE-05        |
| BE-12 | 연차 (LeaveRequests)                        | BE-02, BE-03, BE-05        |
| BE-13 | 연차 잔여 (LeaveBalances) 조회              | BE-02, BE-03, BE-05        |
| BE-14 | 연차 정책 (LeavePolicy) 및 연차 발생 로직   | BE-02, BE-03, BE-05, DB-07 |

---

## 3. 프론트엔드 티어

프론트엔드 티어는 `1-prd.md` 5.2(React, Tanstack Query, Zustand)를 근거로 공통 인프라(라우팅/인증 상태/API 클라이언트/네비게이션) 구축 후, `3-wireframe.md`의 화면 순서(1~9번, 10번 공통 네비게이션은 공통 인프라에 포함)대로 화면별 Task를 진행한다.

#### FE-01. 프로젝트 초기 설정 및 라우팅 구조

- 선행 Task: 없음

**수행 작업**

- React 프로젝트(Vite 등)를 초기화하고 React Router로 페이지 라우팅 구조를 설계한다: `/signup`, `/login`, `/dashboard`, `/leave-requests`, `/leave-requests/manage`(manager), `/attendances/me`, `/attendances`(manager), `/users`(manager), `/me`.
- 컴포넌트/페이지/훅/스토어/API 계층을 구분하는 디렉토리 구조(`pages`, `components`, `hooks`, `store`, `api`)를 구성한다.

**작업 완료 조건**

- [x] `npm run dev`로 앱이 기동되고 각 라우트 경로 접근 시 대응하는 플레이스홀더 페이지가 렌더링된다.
- [x] 라우팅 구조가 3-wireframe.md의 9개 화면 + 공통 네비게이션과 1:1로 매핑된다.

#### FE-02. API 클라이언트 및 Tanstack Query 설정

- 선행 Task: FE-01

**수행 작업**

- Tanstack Query `QueryClient`를 설정하고 앱 루트에 Provider를 구성한다.
- Access Token을 자동으로 `Authorization` 헤더에 부착하는 API 클라이언트(axios/fetch wrapper)를 구현한다.
- 401 응답 수신 시 Refresh Token으로 자동 재발급을 시도하고, 재발급도 실패하면 로그아웃 처리 후 로그인 화면으로 리다이렉트하는 인터셉터를 구현한다(PRD 8 엣지 케이스).
- `swagger.yaml`의 18개 경로에 대응하는 API 함수 모듈(`api/auth.js`, `api/users.js`, `api/attendances.js`, `api/leaveRequests.js`, `api/leaveBalances.js`, `api/leavePolicy.js`)의 골격을 정의한다.

**작업 완료 조건**

- [x] 임의 쿼리 훅 호출 시 Tanstack Query devtools 또는 네트워크 탭에서 정상적으로 요청/캐싱이 확인된다.
- [x] Access Token 만료(401) 상황을 모킹했을 때 자동으로 재발급 요청이 발생하고 원 요청이 재시도됨을 확인한다.
- [x] Refresh Token도 만료된 상황에서는 로그인 화면으로 리다이렉트됨을 확인한다.

#### FE-03. 인증 상태 관리 및 라우트 가드

- 선행 Task: FE-02, BE-07, BE-08

**수행 작업**

- Zustand 스토어로 인증 상태(`accessToken`, `refreshToken`, `user`, `role`)를 관리하고, 새로고침 시에도 유지되도록 영속화(localStorage 등)한다.
- 로그인/회원가입되지 않은 사용자가 보호된 라우트에 접근하면 `/login`으로 리다이렉트하는 `ProtectedRoute` 컴포넌트를 구현한다.
- `role` 기반 접근 제어 컴포넌트(`RequireRole('manager')` 등)를 구현해 employee가 manager 전용 라우트 접근 시 차단(리다이렉트 또는 접근 불가 안내)한다.
- 로그아웃 액션(토큰 즉시 삭제 후 `/login` 이동)을 구현한다(시나리오 9).

**작업 완료 조건**

- [x] 로그인하지 않은 상태로 `/dashboard` 접근 시 `/login`으로 리다이렉트된다.
- [x] employee 계정으로 manager 전용 라우트 접근 시 차단된다.
- [x] 로그아웃 클릭 시 스토어와 저장소의 토큰이 즉시 제거되고 뒤로가기로도 보호된 페이지에 재진입할 수 없다.
- [x] 새로고침 후에도 로그인 상태가 유지된다(토큰이 있는 동안).

#### FE-04. 공통 네비게이션 및 반응형 레이아웃

- 선행 Task: FE-03

**수행 작업**

- `3-wireframe.md` 10번 화면대로 역할별(employee/manager) 메뉴가 다른 상단 네비게이션을 구현한다.
- 768px 미만에서 햄버거 메뉴+풀스크린 드로어로 전환되는 반응형 레이아웃을 구현한다(브레이크포인트: ~~767px 모바일, 768~~1023px 태블릿, 1024px~ 데스크톱).
- 로그인하지 않은 상태에서는 네비게이션 대신 로그인/회원가입 링크만 노출한다.

**작업 완료 조건**

- [x] employee 로그인 시 대시보드/연차 신청/내 근태 현황/내 정보 메뉴만 노출된다.
- [x] manager 로그인 시 대시보드/연차 신청/연차 승인 관리/전체 근태 현황/사용자 관리/내 정보 메뉴가 모두 노출된다.
- [x] 뷰포트를 767px 이하로 줄이면 햄버거 메뉴로 전환되고 클릭 시 전체화면 드로어가 열린다.

#### FE-05. 회원가입 화면

- 선행 Task: FE-02, BE-06

**수행 작업**

- `3-wireframe.md` 1번 화면대로 이메일/이름/사번/입사일/비밀번호/비밀번호 확인 입력 폼을 구현한다.
- 클라이언트 유효성 검증(필수 필드, 비밀번호 확인 일치)과 `POST /auth/signup` 연동을 구현한다.
- 사번 중복(409) 시 사번 필드 하단에 에러 메시지를 표시하고, 성공 시 완료 메시지 후 로그인 화면으로 자동 이동한다.

**작업 완료 조건**

- [x] 필수 필드 미입력 또는 비밀번호 확인 불일치 시 "가입하기" 버튼이 비활성화되거나 제출이 차단된다.
- [x] 중복된 사번으로 제출 시 `이미 등록된 사번입니다` 에러가 화면에 표시되고 화면이 유지된다.
- [x] 정상 가입 성공 시 로그인 화면으로 자동 이동한다.

#### FE-06. 로그인 화면

- 선행 Task: FE-03, BE-07

**수행 작업**

- `3-wireframe.md` 2번 화면대로 이메일/비밀번호 입력 폼과 `POST /auth/login` 연동을 구현한다.
- 로그인 성공 시 Zustand 스토어에 토큰/사용자 정보를 저장하고 대시보드로 이동한다.
- 인증 실패(401)/비활성 계정(403) 시 공통 에러 메시지를 표시한다.

**작업 완료 조건**

- [x] 올바른 계정으로 로그인 시 대시보드로 이동하고 토큰이 저장된다.
- [x] 잘못된 비밀번호로 로그인 시 계정 존재 여부를 노출하지 않는 공통 에러 메시지가 표시된다.
- [x] 비활성 계정으로 로그인 시 403에 대응하는 안내 메시지가 표시된다.

#### FE-07. 대시보드 화면 (출근/퇴근 체크인·체크아웃)

- 선행 Task: FE-04, BE-11, BE-13

**수행 작업**

- `3-wireframe.md` 3번 화면대로 오늘의 근태(체크인/체크아웃 시각), 출근/퇴근 버튼, 이번 달 요약(출근일수, 잔여 연차) 카드를 구현한다.
- `POST /attendances/check-in`/`check-out` 연동 및 상태에 따른 버튼 활성/비활성 전환을 구현한다.
- 체크인 완료 전 체크아웃 버튼 비활성화, 체크인 완료 후 체크인 버튼은 "완료(HH:MM)"로 비활성화 전환한다. 체크아웃 버튼은 체크인 완료 후 여러 번 클릭 가능하도록 계속 활성 상태를 유지하며, 클릭할 때마다 체크아웃 시각 표시를 갱신한다.
- 409/400 에러 발생 시 토스트로 에러 메시지를 표시한다.
- 모바일(~767px)에서 버튼이 세로 스택+폭 100%로 전환되는 레이아웃을 구현한다.

**작업 완료 조건**

- [x] 체크인 전 상태에서는 "퇴근" 버튼이 비활성화되어 있다.
- [x] 출근 체크인 클릭 시 성공하면 버튼이 "체크인 완료(HH:MM)"로 즉시 전환되고 퇴근 버튼이 활성화된다.
- [x] 체크인 완료 상태에서 체크인 버튼이 비활성화되어 재클릭이 불가능하다.
- [x] 퇴근 체크아웃 클릭 시 성공하면 체크아웃 시각 표시가 갱신되고, 버튼은 비활성화되지 않아 재클릭할 수 있다.
- [x] 체크아웃 버튼을 여러 번 클릭하면 체크아웃 시각이 마지막 클릭 시각으로 갱신된다.
- [x] 이번 달 요약 카드에 본인 출근일수와 잔여 연차일수가 표시된다.

#### FE-08. 연차 신청 화면 (employee/manager 공통)

- 선행 Task: FE-04, BE-12, BE-13

**수행 작업**

- `3-wireframe.md` 4번 화면대로 잔여 연차 표시, 시작일/종료일 date picker, 구분(종일/오전/오후) 드롭다운, 자동 계산된 신청 일수, 사유 입력, "신청" 버튼, 하단 "내 연차 신청 내역" 목록을 구현한다.
- `POST /leave-requests`, `GET /leave-requests/me`, `GET /leave-balances/me` 연동을 구현한다.
- 시작일 > 종료일 클라이언트 유효성 검증과 서버 400 응답 처리, 잔여 연차 초과(400) 에러 표시를 구현한다.
- 구분 드롭다운 기본값은 "종일"이며, "오전"/"오후" 선택 시 종료일을 시작일과 같은 값으로 자동 고정하고 비활성화, 신청 일수를 0.5일로 표시하며 `halfDay` 필드를 함께 전송한다.
- 신청 성공 시 목록에 "대기중" 상태로 즉시 반영(쿼리 무효화/리패치)한다.

**작업 완료 조건**

- [x] 시작일이 종료일보다 늦게 입력되면 제출 전 클라이언트에서 즉시 경고가 표시된다.
- [x] 잔여일수를 초과하는 신청 제출 시 "잔여 연차일수가 부족합니다" 에러가 표시되고 목록에 추가되지 않는다.
- [x] 정상 신청 성공 시 목록 최상단(또는 해당 위치)에 "대기중" 상태로 즉시 노출된다.
- [x] 구분을 "오전"으로 선택하면 종료일이 시작일과 같아지고 비활성화되며, 신청 일수가 0.5일로 표시된다.
- [x] 반차로 정상 제출된 건은 "내 연차 신청 내역" 목록의 구분 컬럼에 "오전 반차"/"오후 반차"로 표시된다.

#### FE-09. 연차 승인 관리 화면 (manager)

- 선행 Task: FE-04, BE-12

**수행 작업**

- `3-wireframe.md` 5번 화면대로 상태 필터(대기중/전체), 목록(신청자/기간/사유/상태/처리 버튼), 승인/반려 확인 모달을 구현한다.
- `GET /leave-requests`, `PATCH /leave-requests/{id}/approve`, `PATCH /leave-requests/{id}/reject` 연동을 구현한다.
- 로그인한 manager 본인이 신청한 건은 승인/반려 버튼을 비활성화하고 안내 문구를 표시한다.
- 이미 처리된 건 재처리 시도(409) 에러 토스트, 처리 완료 후 목록에서 즉시 제거(쿼리 무효화)를 구현한다.
- 모바일(~767px) 카드형 리스트, 승인/반려 풀스크린 모달을 구현한다.

**작업 완료 조건**

- [x] "대기중" 필터에서 대기 중인 신청만 표시된다.
- [x] 로그인한 manager 본인의 신청 건은 승인/반려 버튼이 비활성화되어 있고 안내 문구가 표시된다.
- [x] 다른 manager 신청 건에 대해 승인 클릭 → 확인 모달 → 승인 확정 시 목록에서 해당 건이 대기중 목록에서 사라진다.
- [x] 이미 처리된 건에 대한 재처리 시도 시 에러 토스트가 표시된다.

#### FE-10. 내 근태 현황 조회 화면 (employee, 월별)

- 선행 Task: FE-04, BE-11

**수행 작업**

- `3-wireframe.md` 6번 화면대로 조회 월 드롭다운, 출퇴근 기록 테이블(날짜/체크인/체크아웃/상태), 연차 사용 내역 테이블을 구현한다.
- `GET /attendances/me?month=YYYY-MM`, `GET /leave-requests/me` 연동을 구현한다.
- 체크아웃 누락 날짜에 "미완료" 상태 표시, 연차 사용일에 "연차" 표시를 구현한다.
- 모바일(~767px) 카드형 리스트로 전환한다.
- 조회 결과가 없는 경우 빈 상태 메시지를 표시한다.

**작업 완료 조건**

- [x] 월 변경 시 해당 월의 출퇴근/연차 데이터가 재조회되어 표시된다.
- [x] 체크아웃 시각이 없는 날짜는 "미완료"로 별도 표시된다.
- [x] 기록이 없는 월을 조회하면 빈 상태 메시지가 표시된다.

#### FE-11. 전체 근태 현황 조회 화면 (manager, 월+대상 선택)

- 선행 Task: FE-04, BE-11, BE-12

**수행 작업**

- `3-wireframe.md` 7번 화면대로 조회 월/대상(전체 직원 또는 개별 직원) 드롭다운을 구현한다.
- 전체 선택 시 직원별 요약 테이블(출근일수, 미체크아웃 건수, 연차 사용일수), 개별 선택 시 해당 직원의 일별 상세+연차 내역을 구현한다.
- `GET /attendances?month=YYYY-MM&userId=...`, `GET /users`(대상 목록), `GET /leave-requests` 연동을 구현한다.
- 모바일(~767px) 카드형 리스트로 전환한다.

**작업 완료 조건**

- [x] "전체 직원" 선택 시 직원별 요약 테이블이 표시된다.
- [x] 특정 직원 선택 시 해당 직원의 상세 출퇴근/연차 내역만 재조회되어 표시된다.
- [x] employee 계정으로 이 화면 접근 시 접근이 차단되고 안내 후 다른 화면으로 리다이렉트된다.

#### FE-12. 사용자 관리 / 관리자 계정 생성 화면 (manager)

- 선행 Task: FE-04, BE-10, BE-13, BE-14

**수행 작업**

- `3-wireframe.md` 8번 화면대로 전체 사용자 목록 테이블(사번/이름/역할/입사일/상태)과 "관리자 계정 생성" 버튼/모달을 구현한다.
- `GET /users`, `POST /users` 연동을 구현한다.
- 사번 중복(409) 에러 표시, 생성 성공 시 완료 메시지와 목록 즉시 반영(쿼리 무효화)을 구현한다.
- employee 계정이 URL로 직접 접근 시 접근 차단 안내를 표시한다(라우트 가드 FE-03과 연계).
- 모바일(~767px)에서 생성 폼이 풀스크린으로 전환된다.
- (2026-09-13 추가) "공통 연차일수 설정" 카드를 추가한다: `GET/PATCH /leave-policy` 연동, 저장 성공 시 전체 재계산 안내 토스트를 표시한다.
- (2026-09-13 추가) 사용자 목록 테이블에 "총 연차일수"/"사용·잔여 연차" 컬럼(읽기 전용)을 추가한다: `GET /leave-balances` 연동, `userId` 기준으로 사용자 목록과 매칭해 표시한다. 개별 직원의 총연차를 직접 수정하는 UI는 두지 않는다.

**작업 완료 조건**

- [x] manager 계정으로 사용자 목록이 정상 표시된다.
- [x] 관리자 계정 생성 폼 제출 시 성공하면 목록에 신규 manager가 즉시 반영된다.
- [x] 중복 사번으로 생성 시도 시 에러 메시지가 표시되고 목록이 변경되지 않는다.
- [x] employee 계정으로 이 화면 URL 접근 시 접근이 차단된다.
- [x] "공통 연차일수 설정" 카드에서 값을 저장하면 성공 토스트가 표시되고, 사용자 목록의 총/사용/잔여 연차 컬럼이 재계산된 값으로 갱신된다.

#### FE-13. 내 정보 / 비밀번호 변경 화면

- 선행 Task: FE-04, BE-10

**수행 작업**

- `3-wireframe.md` 9번 화면대로 본인 정보(이름/이메일/사번/입사일/역할) 읽기 전용 영역과 비밀번호 변경 폼(현재 비밀번호/새 비밀번호/새 비밀번호 확인)을 구현한다.
- `GET /users/me`, `PATCH /users/me/password` 연동을 구현한다.
- 현재 비밀번호 불일치 시 에러 표시, 새 비밀번호/확인 불일치 시 클라이언트 즉시 경고를 구현한다.
- 변경 성공 시 응답으로 받은 신규 토큰을 스토어에 반영해 세션을 유지하고 완료 토스트를 표시한다.

**작업 완료 조건**

- [x] 본인 정보(이름/이메일/사번/입사일/역할)가 화면에 정확히 표시된다.
- [x] 현재 비밀번호를 틀리게 입력하면 에러가 표시되고 비밀번호가 변경되지 않는다.
- [x] 새 비밀번호와 확인이 다르면 제출 전 클라이언트에서 경고가 표시된다.
- [x] 정상 변경 성공 시 완료 토스트가 표시되고 세션이 끊기지 않고 유지된다(신규 토큰 반영).

### 프론트엔드 티어 Task 목록

| 번호  | 제목                                             | 선행 Task           |
| ----- | ------------------------------------------------ | ------------------- |
| FE-01 | 프로젝트 초기 설정 및 라우팅 구조                | 없음                |
| FE-02 | API 클라이언트 및 Tanstack Query 설정            | FE-01               |
| FE-03 | 인증 상태 관리 및 라우트 가드                    | FE-02, BE-07, BE-08 |
| FE-04 | 공통 네비게이션 및 반응형 레이아웃               | FE-03               |
| FE-05 | 회원가입 화면                                    | FE-02, BE-06        |
| FE-06 | 로그인 화면                                      | FE-03, BE-07        |
| FE-07 | 대시보드 화면 (출근/퇴근 체크인·체크아웃)        | FE-04, BE-11, BE-13 |
| FE-08 | 연차 신청 화면 (employee/manager 공통)           | FE-04, BE-12, BE-13 |
| FE-09 | 연차 승인 관리 화면 (manager)                    | FE-04, BE-12        |
| FE-10 | 내 근태 현황 조회 화면 (employee, 월별)          | FE-04, BE-11        |
| FE-11 | 전체 근태 현황 조회 화면 (manager, 월+대상 선택) | FE-04, BE-11, BE-12 |
| FE-12 | 사용자 관리 / 관리자 계정 생성 화면 (manager)    | FE-04, BE-10, BE-13, BE-14 |
| FE-13 | 내 정보 / 비밀번호 변경 화면                     | FE-04, BE-10        |

---

## 4. 향후 검토 (P2)

`1-prd.md` 5.3절 P2(향후 검토) 항목은 이번 실행계획의 Task로 만들지 않고 목록으로만 남긴다.

- 관리자에 의한 사용자 정보 수정
- 연차 신청 취소/수정 기능
- 관리자에 의한 근태 기록 수동 보정
- 비밀번호 관리자 재설정

---

## 5. 전체 Task 개수 요약

| 티어           | Task 개수 |
| -------------- | --------- |
| DB             | 7         |
| 백엔드(BE)     | 14        |
| 프론트엔드(FE) | 13        |
| **합계**       | **34**    |
