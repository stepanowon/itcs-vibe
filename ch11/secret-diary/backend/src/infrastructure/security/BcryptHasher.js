const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// 비밀번호 해시/검증 (FR-1.7)
class BcryptHasher {
  async hash(plainText) {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  async compare(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  }
}

module.exports = { BcryptHasher };
