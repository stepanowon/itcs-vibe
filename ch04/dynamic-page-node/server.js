const express = require('express');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

function loadTodos() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveTodos(todos) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderPage(todos) {
  const remaining = todos.filter((t) => !t.done).length;
  const items = todos.map((t) => `
        <li class="todo-item ${t.done ? 'done' : ''}">
          <form action="/todos/${t.id}/toggle" method="post" class="toggle-form">
            <button type="submit" class="check-btn" aria-label="완료 토글">${t.done ? '✓' : ''}</button>
          </form>
          <span class="todo-text">${escapeHtml(t.text)}</span>
          <form action="/todos/${t.id}/delete" method="post" class="delete-form">
            <button type="submit" class="delete-btn" aria-label="삭제">✕</button>
          </form>
        </li>`).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TodoList</title>
<style>
  :root{
    --accent:#4f46e5;
    --accent2:#06b6d4;
    --text:#1e293b;
    --muted:#64748b;
    --bg:#f8fafc;
    --card:#ffffff;
    --border:#e2e8f0;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    font-family:'Segoe UI','Pretendard','Apple SD Gothic Neo',sans-serif;
    background:var(--bg);
    color:var(--text);
    line-height:1.7;
  }
  header.hero{
    background:linear-gradient(135deg,#4f46e5,#06b6d4);
    color:#fff;
    padding:56px 24px 48px;
    text-align:center;
  }
  header.hero .badge{
    display:inline-block;
    padding:6px 16px;
    border-radius:999px;
    background:rgba(255,255,255,.18);
    font-size:13px;
    margin-bottom:16px;
  }
  header.hero h1{
    margin:0 0 10px;
    font-size:clamp(26px,4.5vw,38px);
  }
  header.hero p{
    margin:0 auto;
    max-width:600px;
    color:rgba(255,255,255,.9);
    font-size:15px;
  }
  main{
    max-width:640px;
    margin:0 auto;
    padding:40px 24px 100px;
  }
  .card{
    background:var(--card);
    border:1px solid var(--border);
    border-radius:16px;
    padding:26px 28px;
    margin-bottom:20px;
    box-shadow:0 4px 16px rgba(15,23,42,.04);
  }
  .add-form{
    display:flex;
    gap:10px;
  }
  .add-form input[type=text]{
    flex:1;
    padding:12px 14px;
    border:1px solid var(--border);
    border-radius:10px;
    font-size:15px;
    font-family:inherit;
  }
  .add-form input[type=text]:focus{
    outline:2px solid var(--accent);
    outline-offset:1px;
  }
  .add-form button{
    background:var(--accent);
    color:#fff;
    border:none;
    border-radius:10px;
    padding:0 20px;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
  }
  .add-form button:hover{background:#4338ca;}
  .todo-list{
    list-style:none;
    margin:0;
    padding:0;
  }
  .todo-item{
    display:flex;
    align-items:center;
    gap:12px;
    padding:12px 0;
    border-bottom:1px solid var(--border);
  }
  .todo-item:last-child{border-bottom:none;}
  .toggle-form, .delete-form{margin:0;}
  .check-btn{
    width:26px;
    height:26px;
    border-radius:50%;
    border:2px solid var(--accent2);
    background:#fff;
    color:var(--accent2);
    font-weight:800;
    font-size:14px;
    cursor:pointer;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
  }
  .todo-item.done .check-btn{
    background:var(--accent2);
    color:#fff;
  }
  .todo-text{
    flex:1;
    font-size:15px;
    color:#334155;
    word-break:break-word;
  }
  .todo-item.done .todo-text{
    color:var(--muted);
    text-decoration:line-through;
  }
  .delete-btn{
    background:none;
    border:none;
    color:var(--muted);
    font-size:16px;
    cursor:pointer;
    padding:4px 8px;
  }
  .delete-btn:hover{color:#b91c1c;}
  .empty{
    color:var(--muted);
    font-size:14.5px;
    text-align:center;
    padding:20px 0;
  }
  .status-line{
    color:var(--muted);
    font-size:13.5px;
    margin-top:14px;
  }
  footer{
    text-align:center;
    padding:30px;
    color:var(--muted);
    font-size:13px;
  }
</style>
</head>
<body>

<header class="hero">
  <span class="badge">오늘의 할 일</span>
  <h1>TodoList</h1>
  <p>서버에 파일로 저장되는 간단한 할 일 목록입니다.</p>
</header>

<main>
  <div class="card">
    <form class="add-form" action="/todos" method="post">
      <input type="text" name="text" placeholder="할 일을 입력하세요" autocomplete="off" required>
      <button type="submit">추가</button>
    </form>
  </div>

  <div class="card">
    <ul class="todo-list">
      ${items || '<li class="empty">할 일이 없습니다.</li>'}
    </ul>
    <div class="status-line">${todos.length}개 중 ${remaining}개 남음</div>
  </div>
</main>

<footer>Node.js + Express · 파일 저장 TodoList</footer>

</body>
</html>`;
}

const app = express();
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send(renderPage(loadTodos()));
});

app.post('/todos', (req, res) => {
  const text = (req.body.text || '').trim();
  if (text) {
    const todos = loadTodos();
    todos.push({ id: Date.now().toString(36), text, done: false });
    saveTodos(todos);
  }
  res.redirect('/');
});

app.post('/todos/:id/toggle', (req, res) => {
  const todos = loadTodos();
  const todo = todos.find((t) => t.id === req.params.id);
  if (todo) todo.done = !todo.done;
  saveTodos(todos);
  res.redirect('/');
});

app.post('/todos/:id/delete', (req, res) => {
  const todos = loadTodos().filter((t) => t.id !== req.params.id);
  saveTodos(todos);
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
