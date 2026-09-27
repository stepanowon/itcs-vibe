const crypto = require('crypto');

// Refresh Token 원문을 결정적(deterministic)으로 해시하여 DB token_hash 컬럼에 인덱싱 가능하도록 한다.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { hashToken };
