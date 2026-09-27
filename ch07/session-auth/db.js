const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'session-auth.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
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

module.exports = {
  findUserByUsername,
  verifyPassword,
};
