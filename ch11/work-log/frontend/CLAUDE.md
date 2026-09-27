# 프론트엔드 지침

## 스택
React 19 + Tanstack Query(백엔드 통신) + 전역 상태 관리 라이브러리(`docs/1-prd.md` 5.2). API base URL은 `/api`(`docs/4-swagger.json` servers 기준).

## 반응형 기준 (`docs/5-wireframe.md` 0번)
| 구분 | 너비 | 레이아웃 |
|---|---|---|
| Mobile | ~767px | 1단 세로 스택, 상단 헤더의 햄버거 메뉴로 내비게이션 |
| Tablet/Desktop | 768px~ | 상단 헤더에 가로 메뉴 노출, 목록/필터 2단 배치 |

- 폼 입력 필드는 모바일에서 전체 폭(100%), 데스크톱에서는 2단 컬럼 그리드
- 버튼/터치 영역은 모바일에서 최소 44px 높이 확보
- 모든 화면은 모바일/데스크톱 두 레이아웃을 함께 고려해서 구현한다(`docs/5-wireframe.md` 참고)

## 화면 구성 (`docs/5-wireframe.md`)
1. 회원가입 — 이름/부서/이메일/패스워드 (고유식별자 userCode는 서버가 자동 부여, 입력받지 않음)
2. 로그인 — email + password (userCode 로그인은 지원하지 않음)
3. 업무일지 목록 — isCompleted 필터, 모바일 카드형/데스크톱 표 형태, 페이지네이션
4. 업무일지 작성/수정 — 입력 순서: 작성일자, 제목, 업무내용, 문제점 및 해결방안(선택), 완료여부, 내일 계획(선택). 모바일 1단/데스크톱 2단 컬럼
5. 업무일지 상세 — 수정/삭제 진입, 삭제는 확인 모달 후 처리(소프트 삭제)
6. 마이페이지 — 내 정보(작성 갯수 포함), 패스워드 변경, 로그아웃

## 인증/토큰 처리
- 로그인 성공 시 Access Token(12시간)/Refresh Token(7일)을 저장한다
- Access Token 만료 시 Refresh Token으로 자동 재발급(`POST /auth/refresh`)을 시도하고, 실패하면 로그인 화면으로 이동한다
- 로그아웃 시 `POST /auth/logout`으로 Refresh Token을 서버에서 무효화한다
- 인증이 필요한 화면/요청은 로그인 여부를 먼저 확인하고, 미로그인 시 로그인 화면으로 리다이렉트한다

## API 연동 규칙
- `docs/4-swagger.json`의 스키마(필드명 camelCase)를 그대로 따른다
- 업무일지 관련 응답의 `dayOfWeek`는 서버가 `logDate`로부터 계산해서 내려주는 값이므로 클라이언트에서 별도로 계산하지 않는다
- 동일 날짜 중복 작성(409), 필수값 누락(400), 타 사용자 리소스 접근(403), 존재하지 않거나 삭제된 리소스(404) 등 에러 응답을 화면별로 적절히 안내한다

## 참고 문서
`docs/1-prd.md`(요구사항), `docs/4-swagger.json`(API 명세), `docs/5-wireframe.md`(화면/반응형 기준), `docs/6-user-story.md`(시나리오), `docs/7-execution-plan.md`(Task 진행 상태/완료 조건 — 프론트엔드 Task는 FE-1~FE-9)
