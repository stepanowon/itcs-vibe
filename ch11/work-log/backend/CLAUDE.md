# 백엔드 지침

## 스택
Node.js + Express + JavaScript. Supabase PostgreSQL에 `pg` 드라이버로 직접 접속(ORM 미사용, `docs/1-prd.md` 5.2).

## 아키텍처 (Clean Architecture, 4계층)
- `src/domain`: 에러 타입(`AppError` 등) 등 순수 도메인 요소
- `src/application`: Use Case (auth/work-logs/users)
- `src/infrastructure`: config(env), db(pool), repositories(Pg*), security(bcrypt/JWT)
- `src/interfaces/http`: app.js, routes, middlewares(authGuard/errorHandler/validate 등)

의존 방향은 항상 `interfaces → application → domain`, `infrastructure`는 인터페이스 구현체를 주입한다. SOLID 원칙을 준수한다(`docs/1-prd.md` 5.2).

## 라우팅/인증
- API prefix `/api` (`docs/4-swagger.json` servers 기준), Swagger UI는 `docs/4-swagger.json`을 그대로 서빙
- JWT Access Token 12시간 / Refresh Token 7일 유효(`docs/1-prd.md` 5.1). 시크릿과 TTL은 환경변수로 분리 관리
- Refresh Token은 `refresh_tokens` 테이블(`token_hash`, `expires_at`, `revoked_at`)에 저장해 재발급/로그아웃 시 즉시 무효화(revoke)한다. 원문이 아니라 해시값만 저장한다(`docs/2-erd.md` 2.3)
- 로그인은 email + password 로만 처리한다(`user_code` 로그인은 범위 밖)
- 회원가입은 email/password/name/department만 입력받는다. `user_code`(전용 고유 식별자)는 서버가 자동 생성하여 부여한다
- 모든 업무일지 API는 로그인 사용자 소유 데이터만 조회/수정/삭제할 수 있도록 `user_id` 조건을 강제한다(RBAC 없음, 사용자별 데이터 격리만 존재, `docs/1-prd.md` 3.3)
- Supabase RLS는 사용하지 않는다. 백엔드가 서비스 롤로 DB에 직접 접근하며 격리는 API 레이어에서만 강제한다(`docs/2-erd.md` 3번 설계 메모)

## 업무일지(work_logs) 도메인 규칙
- 소프트 삭제: 실제 행을 지우지 않고 `is_deleted=true`로만 지정한다. 목록/상세 조회, 작성 갯수 집계 등 모든 조회 쿼리는 반드시 `is_deleted = false` 조건을 포함한다(`docs/2-erd.md` 2.2, 3번)
- 동일 사용자의 동일 `log_date`는 삭제되지 않은 건 기준으로 1건만 허용한다(부분 UNIQUE 인덱스 `WHERE is_deleted = false`). 삭제된 날짜는 재작성을 허용한다
- 작성 필드는 `logDate`/`title`/`content`/`isCompleted`(필수)와 `issueSolution`(문제점 및 해결방안)/`tomorrowPlan`(내일 계획, 둘 다 선택)뿐이다. 그 외 항목(업무 성과/협조요청/미룬업무/차주계획/프로젝트/태그)은 범위 밖(`docs/1-prd.md` 5.1)
- 요일은 `log_date`로부터 계산해서 응답에 포함하며 별도 컬럼에 저장하지 않는다(`WorkLog.dayOfWeek`는 계산값)
- 목록 조회는 `isCompleted` 필터와 `page`/`limit` 페이지네이션을 지원한다(`docs/4-swagger.json` GET /work-logs)
- 타 사용자의 업무일지 id로 접근 시 403, 존재하지 않거나 삭제된 id는 404로 응답한다

## 환경변수
`.env`(gitignore 대상, 커밋 금지) 필요: DB 접속 정보, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, Access/Refresh Token TTL, CORS 허용 origin. 새 환경변수를 추가할 때는 `.env.example`도 함께 관리한다.

## 참고 문서
`docs/1-prd.md`(요구사항), `docs/2-erd.md`(테이블 설계), `docs/3-ddl.sql`(DB 생성 스크립트), `docs/4-swagger.json`(API 명세), `docs/5-wireframe.md`(화면), `docs/6-user-story.md`(시나리오), `docs/7-execution-plan.md`(Task 진행 상태/완료 조건 — 백엔드 Task는 BE-1~BE-10)
