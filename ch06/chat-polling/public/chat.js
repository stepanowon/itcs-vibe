const POLL_INTERVAL_MS = 30000;
const messagesEl = document.getElementById('messages');
const whoamiEl = document.getElementById('whoami');
const sendForm = document.getElementById('sendForm');
const contentInput = document.getElementById('content');

let currentUser = null;
let lastId = 0;

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = 'msg' + (msg.username === currentUser.username ? ' mine' : '');
  // 서버는 UTC(datetime('now'))로 저장 → 'Z'를 붙여 파싱한 뒤 브라우저 로케일/타임존으로 표시
  const time = new Date(`${msg.created_at.replace(' ', 'T')}Z`).toLocaleTimeString();
  div.innerHTML = `<span class="who">${msg.display_name}</span>${msg.content}<span class="when">${time}</span>`;
  messagesEl.appendChild(div);
}

async function fetchMessages() {
  const res = await fetch(`/api/messages?after=${lastId}`);
  if (res.status === 401) {
    location.href = 'index.html';
    return;
  }
  const data = await res.json();
  if (data.messages.length === 0) return;
  const shouldScroll = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 20;
  for (const msg of data.messages) {
    renderMessage(msg);
    lastId = msg.id;
  }
  if (shouldScroll) messagesEl.scrollTop = messagesEl.scrollHeight;
}

sendForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = contentInput.value.trim();
  if (!content) return;
  contentInput.value = '';
  await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  fetchMessages();
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
  await fetchMessages();
  setInterval(fetchMessages, POLL_INTERVAL_MS);
})();
