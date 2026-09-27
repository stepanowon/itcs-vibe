const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'sql-injection.db'));

// 비밀번호를 평문으로 저장합니다. SQL Injection 실습에 집중하기 위한 의도적인 단순화이며,
// 실제 서비스에서는 절대 이렇게 저장하면 안 됩니다 (session-auth 예제 참고: scrypt 해시 저장).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL
  );
`);

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const seed = [
    ['user1', 'asdf!2345', 'user1@example.com', 'user'],
    ['user2', 'asdf!2345', 'user2@example.com', 'user'],
    ['admin', 'S3cretAdminPw!', 'admin@example.com', 'admin'],
  ];
  const insert = db.prepare(
    'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)'
  );
  for (const row of seed) insert.run(...row);
}

seedUsers();

module.exports = { db };
