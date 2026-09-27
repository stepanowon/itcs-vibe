const infoEl = document.getElementById('info');

function addRow(label, value) {
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  infoEl.append(dt, dd);
}

async function load() {
  const meRes = await fetch('/api/me');
  const me = await meRes.json();
  if (!me.user) {
    location.href = 'index.html';
    return;
  }

  addRow('사용자', `${me.user.displayName} (${me.user.username})`);

  const sessionRes = await fetch('/api/session-info');
  const session = await sessionRes.json();
  addRow('세션 ID', session.sessionId);
  addRow('세션 만료 시각', new Date(session.cookieExpires).toLocaleString());
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = 'index.html';
});

load();
