# xss

XSS(Cross-Site Scripting)의 원리와 방어 방법(출력 이스케이프)을 비교 실습하기 위한 예제입니다.

## 기술 스택

- Node.js, Express
- EJS (서버사이드 템플릿)

## 실행 방법

```bash
npm install
npm start

# 개발 서버로 실행 (파일 변경 시 자동 재시작)
npm run dev
```

`http://localhost:3000` 접속 시 취약 버전(`/vulnerable`)으로 이동합니다.

## 페이지

| 경로         | 설명                                              |
| ------------ | ------------------------------------------------- |
| `/vulnerable` | 검색어(reflected)와 방명록(stored)을 이스케이프 없이 출력 |
| `/safe`       | EJS `<%= %>` 자동 이스케이프로 방어                |

두 페이지 모두 같은 `views/guestbook.ejs` 템플릿을 사용하며, 취약 버전은 `<%- %>`(이스케이프 없음), 안전 버전은 `<%= %>`(자동 이스케이프)로 렌더링해 차이를 코드에서 바로 비교할 수 있습니다.

## 공격 예시

### 1. Reflected XSS

```
GET /vulnerable?q=<script>alert(document.cookie)</script>
```

검색어가 이스케이프 없이 HTML에 그대로 삽입되어 스크립트가 실행되고, 데모용으로 발급한 `demo_session` 쿠키 값이 alert로 노출됩니다. (실제 서비스라면 세션 쿠키를 탈취해 계정을 가로챌 수 있는 상황입니다.)

### 2. Stored XSS

방명록 등록 폼에 아래 값을 입력하고 등록하면, 이후 그 페이지를 보는 모든 사용자에게 스크립트가 실행됩니다.

```
<script>alert(document.cookie)</script>
```

같은 입력을 `/safe`에 넣어보면 `&lt;script&gt;...`로 이스케이프되어 텍스트 그대로만 출력되고 스크립트는 실행되지 않는 것을 확인할 수 있습니다.

## 참고

- `demo_session` 쿠키는 XSS로 세션 쿠키를 탈취하는 상황을 보여주기 위해 의도적으로 `httpOnly: false`로 발급합니다. 실제 서비스에서는 세션 쿠키에 항상 `httpOnly`(+ `secure`)를 설정해야 합니다.
- 이 예제는 교육용으로 XSS를 의도적으로 재현합니다. 사용자 입력을 HTML에 출력할 때는 템플릿 엔진의 자동 이스케이프를 사용하고, `<%- %>`처럼 이스케이프를 끄는 출력은 반드시 신뢰할 수 있는 값에만 사용해야 합니다. 추가 방어 계층으로 CSP(Content-Security-Policy) 헤더 적용도 권장됩니다.
