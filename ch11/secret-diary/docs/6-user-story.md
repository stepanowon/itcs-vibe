# User Stories & Acceptance Criteria: 나만의 비밀일기 앱

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v1.0 |
| 작성일 | 2026-07-05 |
| 관련 문서 | [1-prd.md](./1-prd.md), [4-swagger.json](./4-swagger.json), [5-wireframe.md](./5-wireframe.md) |

> [PRD 4.2 사용자 스토리](./1-prd.md)를 개발/테스트 가능한 단위로 상세화한다.
> 인수 조건은 **Given-When-Then** 형식으로 기술하며, 각 스토리에 대응 API·화면·우선순위를 명시한다.

**우선순위**: P0(필수/MVP) · P1(중요) · P2(선택)

---

## Epic A. 인증 / 계정 (FR-1)

### US-A1. 회원 가입 · P0
> 사용자로서, 이메일·사용자명·비밀번호로 회원 가입하여 나만의 계정을 만들고 싶다.
- **API**: `POST /auth/signup` · **화면**: S-02

**인수 조건**
- **AC-1** Given 미가입 이메일/사용자명, When 유효한 값으로 가입 요청, Then 201과 함께 계정이 생성되고 `id`(UUID)가 발급된다.
- **AC-2** Given 비밀번호, When 저장, Then 평문이 아닌 **해시(bcrypt)** 로 저장된다.
- **AC-3** Given 이미 존재하는 email 또는 username, When 가입 요청, Then **409**와 중복 안내 메시지를 반환한다.
- **AC-4** Given 잘못된 형식(이메일 형식 오류/비밀번호 8자 미만/사용자명 2자 미만), When 요청, Then **400**과 필드별 검증 메시지를 반환한다.
- **AC-5** 발급되는 `id`는 email·username과 **독립된 고유 식별자**이며 이후 모든 내부 참조에 사용된다. (FR-1.2)

### US-A2. 로그인 · P0
> 사용자로서, 로그인하여 인증된 상태로만 서비스를 이용하고 싶다.
- **API**: `POST /auth/login` · **화면**: S-01

**인수 조건**
- **AC-1** Given 올바른 (email 또는 username) + 비밀번호, When 로그인, Then **200**과 함께 Access Token(12h)·Refresh Token(7d)을 발급받는다.
- **AC-2** Given 존재하지 않는 계정 **또는** 비밀번호 불일치, When 로그인, Then **401**과 **동일한 메시지**("이메일 또는 비밀번호가 올바르지 않습니다")를 반환한다. (계정 존재 여부 노출 금지)
- **AC-3** Given 발급된 Refresh Token, When 저장, Then DB에 **해시**로 저장되고 만료(발급+7일)가 기록된다.

### US-A3. 토큰 자동 갱신 · P0
> 사용자로서, 로그인이 오래 유지되어 자주 다시 로그인하지 않아도 되게 하고 싶다.
- **API**: `POST /auth/refresh` · **화면**: 전역(백그라운드)

**인수 조건**
- **AC-1** Given 만료된 Access Token, When 보호된 API 호출, Then 클라이언트가 자동으로 `refresh`를 호출해 새 Access Token으로 **요청을 재시도**하며 사용자는 흐름 중단을 느끼지 않는다.
- **AC-2** Given 유효한 Refresh Token, When 재발급 요청, Then **200**과 새 Access Token을 반환한다.
- **AC-3** Given 만료/폐기/위조된 Refresh Token, When 재발급 요청, Then **401**을 반환하고 클라이언트는 로그인 화면(S-01)으로 이동한다.

### US-A4. 로그아웃 · P1
> 사용자로서, 로그아웃하여 세션을 안전하게 종료하고 싶다.
- **API**: `POST /auth/logout` · **화면**: 헤더 / S-07

**인수 조건**
- **AC-1** Given 로그인 상태, When 로그아웃, Then 해당 Refresh Token이 `revoked=true`로 무효화된다.
- **AC-2** Given 무효화된 Refresh Token, When 재발급 시도, Then **401**을 반환한다.
- **AC-3** When 로그아웃, Then 클라이언트의 토큰이 제거되고 S-01로 이동한다.

---

## Epic B. 일기 작성 · 관리 (FR-2)

### US-B1. 일기 작성 · P0
> 사용자로서, 제목·본문·날씨·기분·태그를 담아 일기를 작성하고 싶다.
- **API**: `POST /diaries` · **화면**: S-04

**인수 조건**
- **AC-1** Given 인증된 사용자, When 제목·본문(필수) + 날씨·기분·태그(선택)로 작성, Then **201**과 생성된 일기를 반환하며 소유자는 요청자로 설정된다.
- **AC-2** Given 제목 또는 본문 누락, When 작성, Then **400**을 반환한다.
- **AC-3** Given ENUM에 없는 날씨/기분 값, When 작성, Then **400**을 반환한다.
- **AC-4** Given 태그, When 10개 초과 또는 개별 20자 초과, Then **400**을 반환한다.
- **AC-5** Given 기존에 없던 태그명, When 작성, Then 사용자 태그 사전에 태그가 생성되고 일기와 연결된다. (중복 태그명은 재사용)
- **AC-6** Given 미인증 요청, When 작성, Then **401**을 반환한다. (로그인 없이 작성 불가)
- **AC-7** Given 작성 날짜(diaryDate) 미지정, When 작성, Then 오늘 날짜(`CURRENT_DATE`)로 자동 설정된다.
- **AC-8** Given 오늘 이전의 과거 날짜를 diaryDate로 지정, When 작성, Then 지정한 과거 날짜로 저장된다. (어제 못 쓴 일기를 오늘 작성하는 경우)

### US-B2. 내 일기 목록 조회 · P0
> 사용자로서, 내가 쓴 일기를 목록으로 조회하고 싶다.
- **API**: `GET /diaries` · **화면**: S-03

**인수 조건**
- **AC-1** Given 인증된 사용자, When 목록 조회, Then **본인 일기만** 작성 날짜 최신순(diary_date DESC, created_at DESC)으로 반환된다.
- **AC-2** Given 다수의 일기, When 조회, Then page/limit 기반 페이지네이션과 total 정보를 반환한다.
- **AC-3** Given 일기가 없음, When 조회, Then **200**과 빈 배열을 반환하고 화면은 빈 상태를 표시한다.
- **AC-4** 타 사용자의 일기는 어떤 경우에도 목록에 포함되지 않는다.

### US-B3. 일기 필터링 · P0
> 사용자로서, 날씨/기분/태그로 필터링하여 원하는 일기를 빠르게 찾고 싶다.
- **API**: `GET /diaries?weather=&mood=&tag=` · **화면**: S-03

**인수 조건**
- **AC-1** Given 날씨 필터, When 조회, Then 해당 날씨 일기만 반환된다.
- **AC-2** Given 기분 필터, When 조회, Then 해당 기분 일기만 반환된다.
- **AC-3** Given 태그 필터, When 조회, Then 해당 태그가 연결된 일기만 반환된다.
- **AC-4** Given 복합 조건(날씨+기분+태그), When 조회, Then **AND 조건**으로 모두 만족하는 일기만 반환된다.
- **AC-5** Given 잘못된 필터 파라미터(정의되지 않은 ENUM), When 조회, Then **400**을 반환한다.
- **AC-6** Given 조건에 맞는 결과 없음, When 조회, Then **200** + 빈 배열을 반환한다.

### US-B4. 일기 상세 조회 · P0
> 사용자로서, 일기의 상세 내용을 보고 싶다.
- **API**: `GET /diaries/{id}` · **화면**: S-05

**인수 조건**
- **AC-1** Given 본인 소유 일기 ID, When 조회, Then **200**과 제목·본문·날씨·기분·태그·작성 날짜(diaryDate)·작성/수정 시각을 반환한다.
- **AC-2** Given 타인 소유 일기 ID, When 조회, Then **403**(또는 존재 은폐를 위해 404)을 반환한다.
- **AC-3** Given 존재하지 않는 ID, When 조회, Then **404**를 반환한다.

### US-B5. 일기 수정 · P0
> 사용자로서, 내 일기를 수정하고 싶다.
- **API**: `PUT /diaries/{id}` · **화면**: S-06

**인수 조건**
- **AC-1** Given 본인 소유 일기, When 수정 요청, Then **200**과 변경된 일기를 반환하고 `updated_at`이 갱신된다.
- **AC-2** Given 수정 화면 진입, When 로딩, Then 기존 값이 폼에 프리필된다.
- **AC-3** Given 태그 변경, When 저장, Then 연결이 갱신된다(제거된 태그 연결 해제, 새 태그 연결).
- **AC-4** Given 타인 소유/미존재 일기, When 수정, Then **403/404**를 반환한다.
- **AC-5** Given 필수 필드 누락/잘못된 값, When 수정, Then **400**을 반환한다.

### US-B6. 일기 삭제 · P0
> 사용자로서, 내 일기를 삭제하고 싶다.
- **API**: `DELETE /diaries/{id}` · **화면**: S-05(확인 모달)

**인수 조건**
- **AC-1** Given 본인 소유 일기, When 삭제 확인, Then **204**를 반환하고 일기 및 태그 연결(diary_tags)이 제거된다.
- **AC-2** Given 삭제 버튼 클릭, When 실행 전, Then 확인 모달로 이중 확인을 거친다.
- **AC-3** Given 타인 소유/미존재 일기, When 삭제, Then **403/404**를 반환한다.
- **AC-4** 삭제 후 목록(S-03)에서 즉시 사라진다.

---

## Epic C. 사용자 정보 (FR-3)

### US-C1. 내 정보 및 일기 수 조회 · P0
> 사용자로서, 내 프로필과 작성한 일기 수를 조회하고 싶다.
- **API**: `GET /users/me` · **화면**: S-07

**인수 조건**
- **AC-1** Given 인증된 사용자, When 조회, Then email·username·가입일과 **작성 일기 총 개수(diaryCount)** 를 반환한다.
- **AC-2** `diaryCount`는 본인 일기만 집계한다.
- **AC-3** Given 미인증, When 조회, Then **401**을 반환한다.

### US-C2. 비밀번호 변경 · P0
> 사용자로서, 비밀번호를 변경하여 계정 보안을 유지하고 싶다.
- **API**: `PUT /users/me/password` · **화면**: S-07

**인수 조건**
- **AC-1** Given 올바른 현재 비밀번호 + 정책을 만족하는 새 비밀번호, When 변경, Then **204**를 반환하고 새 비밀번호 해시로 갱신된다.
- **AC-2** Given 현재 비밀번호 불일치, When 변경, Then **400**(또는 401)을 반환하고 변경을 거부한다.
- **AC-3** Given 새 비밀번호가 정책 미달(8자 미만), When 변경, Then **400**을 반환한다.
- **AC-4** (권장) 비밀번호 변경 성공 시 기존 Refresh Token을 무효화한다. · P1

---

## 부록: 스토리 ↔ 요구사항 추적 매트릭스

| Story | PRD FR | API | 화면 | 우선순위 |
| --- | --- | --- | --- | --- |
| US-A1 회원가입 | FR-1.1, 1.2, 1.7 | POST /auth/signup | S-02 | P0 |
| US-A2 로그인 | FR-1.3, 1.4 | POST /auth/login | S-01 | P0 |
| US-A3 토큰 갱신 | FR-1.4, 1.5 | POST /auth/refresh | 전역 | P0 |
| US-A4 로그아웃 | FR-1.6 | POST /auth/logout | 헤더/S-07 | P1 |
| US-B1 작성 | FR-2.1 | POST /diaries | S-04 | P0 |
| US-B2 목록 | FR-2.3 | GET /diaries | S-03 | P0 |
| US-B3 필터 | FR-2.7 | GET /diaries?... | S-03 | P0 |
| US-B4 상세 | FR-2.4 | GET /diaries/{id} | S-05 | P0 |
| US-B5 수정 | FR-2.5 | PUT /diaries/{id} | S-06 | P0 |
| US-B6 삭제 | FR-2.6 | DELETE /diaries/{id} | S-05 | P0 |
| US-C1 내 정보 | FR-3.1, 3.2 | GET /users/me | S-07 | P0 |
| US-C2 비번 변경 | FR-3.3 | PUT /users/me/password | S-07 | P0 |

> 공통 인수 조건(모든 보호 스토리 적용): 유효한 Access Token이 없으면 **401**, 타 사용자 리소스 접근 시 **403/404** 로 소유권을 강제한다. (NFR-3)
