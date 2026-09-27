const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'chat.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const seed = [
    ['user1', '홍길동'],
    ['user2', '이몽룡'],
    ['user3', '성춘향'],
  ];
  const insert = db.prepare(
    'INSERT INTO users (username, display_name, salt, password_hash) VALUES (?, ?, ?, ?)'
  );
  for (const [username, displayName] of seed) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword('asdf!2345', salt);
    insert.run(username, displayName, salt, hash);
  }
}

seedUsers();

function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function verifyPassword(user, password) {
  return hashPassword(password, user.salt) === user.password_hash;
}

function getMessagesAfter(afterId) {
  return db
    .prepare(
      `SELECT messages.id, messages.content, messages.created_at, users.username, users.display_name
       FROM messages JOIN users ON users.id = messages.user_id
       WHERE messages.id > ?
       ORDER BY messages.id ASC`
    )
    .all(afterId || 0);
}

function addMessage(userId, content) {
  const result = db
    .prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)')
    .run(userId, content);
  return result.lastInsertRowid;
}

module.exports = {
  findUserByUsername,
  verifyPassword,
  getMessagesAfter,
  addMessage,
};
