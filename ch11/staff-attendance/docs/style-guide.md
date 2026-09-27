# 소규모 사업장 근태관리 앱 스타일 가이드

## 문서 변경 이력

| 버전 | 날짜       | 변경 내용 | 작성자 |
| ---- | ---------- | --------- | ------ |
| 0.1  | 2026-09-06 | 최초 작성 | -      |
| 0.2  | 2026-09-06 | 유사 앱 스크린샷 참고해 좌측 사이드바 네비게이션 + 그린 액센트로 전환 | -      |
| 0.3  | 2026-09-06 | Bootstrap 5 기반으로 전환. 커스텀 CSS 디자인 시스템 폐기, Bootstrap 유틸리티/컴포넌트 클래스 사용으로 전환 | -      |
| 0.4  | 2026-09-07 | 실제 코드와 정합성 검토: 컴포넌트 매핑 표의 누락 클래스(`bg-white`, `modal-dialog-centered`, `show`, `p-3`, `border-0`) 추가, 모바일 드로어 설명 정확화 | -      |

## 개요

프론트엔드는 [Bootstrap 5](https://getbootstrap.com/)를 CSS 프레임워크로 사용한다(`npm install bootstrap`, `bootstrap/dist/css/bootstrap.min.css`를 `main.jsx`에서 로드). 커스텀 CSS 클래스(`.btn--*`, `.badge--*` 등)는 만들지 않고 Bootstrap이 제공하는 유틸리티/컴포넌트 클래스를 그대로 쓴다. 정확한 위치값(사이드바 폭·오프셋 등) 등 Bootstrap 유틸리티만으로 표현 안 되는 최소한의 값만 `layout.css`에 남긴다.

레이아웃(좌측 사이드바 네비게이션)은 0.2판에서 유사 근태관리 앱(`staff-scheduler` 프로젝트) 스크린샷을 참고해 확정한 구조를 그대로 유지한다.

---

## 1. 색상

Bootstrap 기본 테마 색상을 의미대로 재사용한다(별도 Sass 커스터마이징/색상 토큰 오버라이드 없음 — 브랜드를 위한 인디고/그린 등 임의 hex 값을 새로 정의하지 않는다).

| Bootstrap 색상 | 클래스 예시                          | 용도                                             |
| --------------- | -------------------------------------- | -------------------------------------------------- |
| `success`       | `btn-success`, `text-bg-success`       | 주요 버튼(로고/활성 메뉴 텍스트 포함), 승인됨/manager 배지 |
| `warning`       | `text-bg-warning`                      | 대기중/미완료/employee 배지                       |
| `danger`        | `btn-danger`, `text-bg-danger`, `alert-danger` | 반려됨 배지, 에러 알림                     |
| `secondary`     | `btn-outline-secondary`, `text-bg-secondary` | 보조 버튼(취소 등), 비활성 배지              |
| `light`         | `alert-light`                          | 안내 배너(폼 보조 설명)                          |

로고·활성 메뉴는 `text-success`를 사용한다.

---

## 2. 타이포그래피

- 폰트: `'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (Bootstrap 기본 폰트 스택 대신 `body`에 직접 지정, `index.css` 참고)
- 헤딩은 Bootstrap 기본 `<h1>`~`<h2>` 스타일 그대로 사용하거나 `.h3`/`.h6` 유틸리티 클래스로 크기만 조정한다(예: 로그인/회원가입 타이틀은 `<h1 className="h3">`).

---

## 3. 레이아웃 / 반응형

Bootstrap 기본 브레이크포인트(`md`: 768px~)를 그대로 사용한다.

- 상단바(`.navbar`): 높이 60px, 좌측 로고, 우측 사용자명+역할배지+로그아웃(768px 미만에서는 햄버거 버튼만).
- 좌측 사이드바(768px~): 상단바 아래 고정, 폭 220px. `position-fixed` + `layout.css`의 정확한 `top`/`width` 값(Bootstrap 유틸리티는 `!important`가 붙어 있어 이 값들은 유틸리티 클래스로 표현하지 않고 커스텀 셀렉터로만 지정한다).
- 모바일(~767px): 사이드바 대신 상단바 햄버거 버튼 → Bootstrap `offcanvas offcanvas-start` 패턴(React 상태로 open/close 제어)의 드로어. 별도 폭 오버라이드 없이 Bootstrap 기본값(최대 400px, `max-width:100%`)을 사용하므로 일반적인 폰 화면 폭에서는 사실상 전체 화면을 채운다.
- 본문 영역(`.app-content`): `max-width: 1100px`, Bootstrap 패딩 유틸리티(`p-3 p-md-4`) 사용.

---

## 4. 컴포넌트 매핑

UI 키트(`src/components/ui/*.jsx`)는 아래처럼 Bootstrap 클래스를 그대로 내보내는 얇은 래퍼다.

| 컴포넌트 | Bootstrap 클래스                                                   |
| -------- | --------------------------------------------------------------------- |
| Button   | `btn btn-success`(primary) / `btn btn-outline-secondary`(secondary) / `btn btn-danger`(danger). `disabled` 속성은 Bootstrap이 자동으로 흐리게 표시한다 |
| Input    | `form-label` + `form-control`(`is-invalid` + `invalid-feedback`으로 에러 표시) |
| Card     | `card shadow-sm` + `card-header bg-white`/`card-body`                 |
| Badge    | `badge rounded-pill text-bg-{success|warning|danger|secondary}`       |
| Modal    | `modal d-block` + `modal-dialog modal-dialog-centered` + `modal-content` + 별도 `modal-backdrop show`(React가 open 상태를 직접 제어하므로 Bootstrap JS는 사용하지 않는다) |
| Toast    | `toast-container position-fixed top-0 end-0 p-3` 안에 `toast show border-0 text-bg-{success|danger}` |
| 안내 배너 | `alert alert-light border small`                                     |
| 테이블   | `table table-striped align-middle`                                    |

와이어프레임(`3-wireframe.md`) 표기 `[ 버튼 ]`/`⚠ 메시지`/상태 배지 등은 위 표에 따라 그대로 구현한다.

---

## 5. 다크모드

1차 버전 범위 밖(PRD 미요구). Bootstrap 5는 `data-bs-theme="dark"`로 다크모드를 지원하므로, 필요해지면 이 속성만 최상위 요소에 추가하는 정도로 확장 가능하다.

## 6. 접근성 메모

- 모든 상태/역할 배지는 색상만으로 구분하지 않고 텍스트 라벨을 함께 표기한다.
- Bootstrap 폼 컨트롤의 포커스 링(`:focus` 기본 스타일)을 임의로 제거하지 않는다.
- 모달 닫기 버튼은 Bootstrap `.btn-close`를 사용하되 `aria-label`을 한국어("닫기")로 지정한다.
