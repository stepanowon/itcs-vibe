const messagesEl = document.getElementById('messages');
const whoamiEl = document.getElementById('whoami');
const sendForm = document.getElementById('sendForm');
const contentInput = document.getElementById('content');

let currentUser = null;
let ws = null;

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'msg' + (msg.username === currentUser.username ? ' mine' : '');
  // 서버는 UTC(datetime('now'))로 저장 → 'Z'를 붙여 파싱한 뒤 브라우저 로케일/타임존으로 표시
  const time = new Date(`${msg.created_at.replace(' ', 'T')}Z`).toLocaleTimeString();
  div.innerHTML = `<span class="who">${msg.display_name}</span>${msg.content}<span class="when">${time}</span>`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadHistory() {
  const res = await fetch('/api/messages?after=0');
  if (res.status === 401) {
    location.href = 'index.html';
    return;
  }
  const data = await res.json();
  for (const msg of data.messages) renderMessage(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function connectWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${location.host}`);

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') renderMessage(data.message);
  });

  // ponytail: 단순 고정 지연 재연결, 연결이 잦다면 지수 백오프로 교체
  ws.addEventListener('close', () => setTimeout(connectWebSocket, 2000));
}

sendForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const content = contentInput.value.trim();
  if (!content || ws.readyState !== WebSocket.OPEN) return;
  contentInput.value = '';
  ws.send(JSON.stringify({ content }));
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = 'index.html';
});

(async function init() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (!data.user) {
    location.href = 'index.html';
    return;
  }
  currentUser = data.user;
  whoamiEl.textContent = `${currentUser.displayName}님`;
  await loadHistory();
  connectWebSocket();
})();
