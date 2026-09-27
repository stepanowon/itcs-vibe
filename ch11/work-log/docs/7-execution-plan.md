# 업무일지 앱 실행 계획

`docs/1-prd.md` ~ `docs/6-user-story.md` 기준으로 작성. 데이터베이스 / 백엔드 / 프론트엔드 단위로 Task를 구성한다.

## 데이터베이스 (DB)

### DB-1. Supabase 프로젝트 및 확장 설정
- **수행 작업**: Supabase 프로젝트 생성, `pgcrypto` 확장 활성화(`docs/3-ddl.sql` 1~4행), 백엔드에서 사용할 접속 정보(연결 문자열, 서비스 롤 키) 확보
- **선행 Task**: 없음
- **완료 조건**
  - [x] Supabase 프로젝트 생성 완료
  - [x] `pgcrypto` 확장 활성화 확인
  - [x] 백엔드용 DB 접속 정보 확보

### DB-2. users 테이블 생성
- **수행 작업**: `docs/3-ddl.sql`의 `users` 테이블 DDL 실행 (id, user_code, email, username, password_hash, name, department 등 UNIQUE 제약 포함)
- **선행 Task**: DB-1
- **완료 조건**
  - [x] `users` 테이블 생성
  - [x] `user_code`, `email`, `username` UNIQUE 제약 확인

### DB-3. work_logs 테이블 및 인덱스 생성
- **수행 작업**: `work_logs` 테이블 DDL 실행, `(user_id, log_date) WHERE is_deleted = false` 부분 UNIQUE 인덱스, `(user_id, project)` 인덱스, `tags` GIN 인덱스 생성
- **선행 Task**: DB-2
- **완료 조건**
  - [x] `work_logs` 테이블 생성 (모든 컬럼: is_completed, is_deleted 포함)
  - [x] 하루 1건 제약(부분 UNIQUE 인덱스) 동작 확인
  - [x] project/tags 인덱스 생성 확인

### DB-4. refresh_tokens 테이블 생성
- **수행 작업**: `refresh_tokens` 테이블 및 `user_id` 인덱스 생성
- **선행 Task**: DB-2
- **완료 조건**
  - [x] `refresh_tokens` 테이블 생성
  - [x] `token_hash` UNIQUE 제약 확인

## 백엔드 (Backend)

### BE-1. 프로젝트 초기 설정
- **수행 작업**: Node + Express 프로젝트 생성, Clean 아키텍처 레이어 구조(routes/controllers, services, repositories, entities) 구성, 환경변수(.env) 및 DB 연결 설정
- **선행 Task**: DB-1
- **완료 조건**
  - [x] Express 서버 기동 확인
  - [x] 레이어 디렉토리 구조 구성
  - [x] DB 연결 테스트 성공

### BE-2. 공통 미들웨어 구현
- **수행 작업**: 전역 에러 핸들러, JWT 인증 미들웨어(Access Token 검증), 요청 검증(validation) 미들웨어 구현
- **선행 Task**: BE-1
- **완료 조건**
  - [x] 인증 미들웨어로 보호 라우트 접근 제어 확인 (`docs/4-swagger.json` bearerAuth)
  - [x] 에러 응답 포맷(Error 스키마) 통일

### BE-3. 회원가입 API (`POST /auth/signup`)
- **수행 작업**: userCode/email/username 중복 검증, 패스워드 해시 저장, `users` insert 구현
- **선행 Task**: DB-2, BE-2
- **완료 조건**
  - [x] 정상 가입 시 201 응답
  - [x] 중복 값 존재 시 409 응답
  - [x] 필수값 누락 시 400 응답

### BE-4. 로그인 API (`POST /auth/login`)
- **수행 작업**: email+password 검증, Access Token(12h)/Refresh Token(7d) 발급, Refresh Token 해시 저장
- **선행 Task**: BE-3, DB-4
- **완료 조건**
  - [x] 정상 로그인 시 200 + 토큰 발급
  - [x] 인증 실패 시 401 응답

### BE-5. 토큰 재발급/로그아웃 API (`POST /auth/refresh`, `POST /auth/logout`)
- **수행 작업**: Refresh Token 유효성 검증(만료/revoke 여부), Access Token 재발급, 로그아웃 시 Refresh Token revoke 처리
- **선행 Task**: BE-4
- **완료 조건**
  - [x] 유효한 Refresh Token으로 재발급 성공
  - [x] 만료/무효화된 Refresh Token 사용 시 401 응답
  - [x] 로그아웃 후 해당 Refresh Token 재사용 불가 확인

### BE-6. 업무일지 작성 API (`POST /work-logs`)
- **수행 작업**: 로그인 사용자 기준 work_logs insert, 필수값(제목/업무내용/완료여부) 검증, 동일 날짜 중복 작성 시 409 처리
- **선행 Task**: DB-3, BE-2
- **완료 조건**
  - [x] 정상 작성 시 201 응답
  - [x] 필수값 누락 시 400 응답
  - [x] 동일 날짜(미삭제) 중복 작성 시 409 응답
  - [x] 삭제된 날짜는 재작성 가능 확인

### BE-7. 업무일지 목록 조회 API (`GET /work-logs`)
- **수행 작업**: 로그인 사용자 소유 데이터만 조회, project/tag/isCompleted 필터, page/limit 페이지네이션, `is_deleted = false` 조건 적용
- **선행 Task**: BE-6
- **완료 조건**
  - [x] 본인 데이터만 반환 확인
  - [x] 필터(project/tag/isCompleted) 정상 동작
  - [x] 삭제된 항목 미노출 확인

### BE-8. 업무일지 상세조회/수정/삭제 API (`GET/PATCH/DELETE /work-logs/{id}`)
- **수행 작업**: 상세 조회, 부분 수정(PATCH), 소프트 삭제(`is_deleted=true` 처리, updated_at 갱신) 구현, 소유자 검증(타 사용자 접근 403), 미존재/삭제건 404 처리
- **선행 Task**: BE-6
- **완료 조건**
  - [x] 상세 조회 200 응답
  - [x] 수정 후 변경사항 반영 확인
  - [x] 삭제 시 실제 행 유지 + is_deleted=true 확인, 204 응답
  - [x] 타 사용자 접근 403, 존재하지 않거나 삭제된 건 404 확인

### BE-9. 내 정보 조회/패스워드 변경 API (`GET /users/me`, `PATCH /users/me/password`)
- **수행 작업**: 프로필 조회 시 `COUNT(*) FROM work_logs WHERE user_id=? AND is_deleted=false`로 작성 갯수 포함, 패스워드 변경 시 기존 패스워드 검증 후 해시 갱신
- **선행 Task**: BE-4, BE-6
- **완료 조건**
  - [x] 내 정보 조회 시 작성 갯수(삭제 제외) 정상 반환
  - [x] 정상 패스워드 변경 시 204 응답
  - [x] 기존 패스워드 불일치 시 400 응답

### BE-10. API 명세 검증
- **수행 작업**: 구현된 API 응답이 `docs/4-swagger.json` 스키마와 일치하는지 확인 (필드명 camelCase, 상태 코드 등)
- **선행 Task**: BE-3 ~ BE-9
- **완료 조건**
  - [x] 전체 엔드포인트 swagger 명세와 일치 확인

## 프론트엔드 (Frontend)

### FE-1. 프로젝트 초기 설정
- **수행 작업**: React 19 프로젝트 생성, 라우터, Tanstack Query, 전역 상태 관리 라이브러리 설정
- **선행 Task**: 없음
- **완료 조건**
  - [x] 개발 서버 정상 기동
  - [x] Tanstack Query, 전역 상태 라이브러리 연동 확인

### FE-2. 공통 레이아웃/반응형 네비게이션
- **수행 작업**: `docs/5-wireframe.md` 기준 768px 브레이크포인트 적용, 모바일 하단 탭 / 데스크톱 상단 헤더 네비게이션 구현
- **선행 Task**: FE-1
- **완료 조건**
  - [x] 767px 이하에서 하단 탭 노출 확인
  - [x] 768px 이상에서 상단 헤더 네비게이션 노출 확인

### FE-3. 회원가입 화면
- **수행 작업**: `docs/5-wireframe.md` 1번 화면 구현, `POST /auth/signup` 연동, 유효성 검증 및 에러 메시지 처리
- **선행 Task**: FE-1, BE-3
- **완료 조건**
  - [x] 정상 가입 후 로그인 화면 이동 확인
  - [x] 중복값/필수값 오류 메시지 노출 확인

### FE-4. 로그인 화면 및 토큰 관리
- **수행 작업**: `docs/5-wireframe.md` 2번 화면 구현, `POST /auth/login` 연동, Access/Refresh Token 저장, Access Token 만료 시 자동 재발급(`POST /auth/refresh`) 처리
- **선행 Task**: FE-3, BE-4, BE-5
- **완료 조건**
  - [x] 정상 로그인 후 목록 화면 이동 확인
  - [x] Access Token 만료 시 자동 재발급 동작 확인
  - [x] Refresh Token 만료 시 재로그인 화면 이동 확인

### FE-5. 업무일지 작성/수정 화면
- **수행 작업**: `docs/5-wireframe.md` 4번 화면 구현(모바일 1단/데스크톱 2단 컬럼), `POST /work-logs`, `PATCH /work-logs/{id}` 연동, 금요일 로그일 경우 차주 계획 입력란 노출
- **선행 Task**: FE-2, BE-6, BE-8
- **완료 조건**
  - [x] 신규 작성 성공 및 저장 확인
  - [x] 기존 항목 수정 성공 확인
  - [x] 금요일 날짜 선택 시 차주 계획 입력란 노출 확인
  - [x] 동일 날짜 중복 작성 시 오류 메시지 노출 확인

### FE-6. 업무일지 목록/필터 화면
- **수행 작업**: `docs/5-wireframe.md` 3번 화면 구현(모바일 카드형/데스크톱 표 형태), `GET /work-logs` 연동, project/tag/isCompleted 필터 UI, 페이지네이션
- **선행 Task**: FE-2, BE-7
- **완료 조건**
  - [x] 목록 정상 조회 확인
  - [x] 필터 적용 결과 정상 확인
  - [x] 모바일 카드형/데스크톱 표 형태 반응형 전환 확인

### FE-7. 업무일지 상세 화면
- **수행 작업**: `docs/5-wireframe.md` 5번 화면 구현, `GET /work-logs/{id}` 연동, 수정 화면 진입, 삭제 확인 모달 및 `DELETE /work-logs/{id}` 연동
- **선행 Task**: FE-5, FE-6, BE-8
- **완료 조건**
  - [x] 상세 조회 정상 표시 확인
  - [x] 삭제 확인 모달 후 삭제 처리 및 목록에서 제외 확인

### FE-8. 마이페이지 화면
- **수행 작업**: `docs/5-wireframe.md` 6번 화면 구현, `GET /users/me`(작성 갯수 포함), `PATCH /users/me/password` 연동, 로그아웃(`POST /auth/logout`) 처리
- **선행 Task**: FE-2, BE-9
- **완료 조건**
  - [x] 내 정보 및 작성 갯수 정상 표시 확인
  - [x] 패스워드 변경 성공/실패 처리 확인
  - [x] 로그아웃 후 로그인 화면 이동 확인

### FE-9. 통합 테스트 및 반응형 QA
- **수행 작업**: `docs/6-user-story.md`의 전체 시나리오(성공/실패 케이스) 수동 테스트, 모바일(~767px)/데스크톱(768px~) 화면에서 전체 흐름 점검
- **선행 Task**: FE-3 ~ FE-8
- **완료 조건**
  - [x] `docs/6-user-story.md` 전체 시나리오 통과 확인
  - [x] 모바일/데스크톱 반응형 레이아웃 이상 없음 확인
