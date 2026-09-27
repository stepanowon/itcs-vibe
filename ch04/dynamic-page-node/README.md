# TodoList

Node.js + Express 기반 서버 렌더링 TodoList. 데이터는 파일(`data/todos.json`)에 저장됩니다.

## 실행

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000 접속.

## 기능

- 할 일 추가 (`POST /todos`)
- 완료 토글 (`POST /todos/:id/toggle`)
- 삭제 (`POST /todos/:id/delete`)

## 구조

```
server.js        서버 + 페이지 렌더링
data/todos.json  할 일 데이터 저장 파일 (없으면 자동 생성)
```
