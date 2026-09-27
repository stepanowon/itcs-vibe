const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Access(12h)/Refresh(7d) JWT 발급 및 검증. Access/Refresh는 서로 다른 비밀키로 서명하여
// 한쪽 비밀키가 유출되어도 다른 토큰 종류를 위조할 수 없도록 한다.
class JwtProvider {
  constructor({ accessSecret, refreshSecret, accessTtlSeconds, refreshTtlSeconds }) {
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessTtlSeconds = accessTtlSeconds;
    this.refreshTtlSeconds = refreshTtlSeconds;
  }

  signAccessToken(userId) {
    // jti(고유값)가 없으면 같은 초(iat)에 발급된 토큰이 완전히 동일한 문자열이 되어
    // refresh_tokens.token_hash UNIQUE 제약과 충돌할 수 있으므로 매 발급마다 고유 jti를 부여한다.
    return jwt.sign({ sub: userId, type: 'access', jti: crypto.randomUUID() }, this.accessSecret, {
      expiresIn: this.accessTtlSeconds,
    });
  }

  signRefreshToken(userId) {
    return jwt.sign(
      { sub: userId, type: 'refresh', jti: crypto.randomUUID() },
      this.refreshSecret,
      { expiresIn: this.refreshTtlSeconds }
    );
  }

  // 위조/만료 시 jsonwebtoken의 JsonWebTokenError/TokenExpiredError를 그대로 던진다.
  verifyAccessToken(token) {
    const payload = jwt.verify(token, this.accessSecret);
    if (payload.type !== 'access') {
      throw new jwt.JsonWebTokenError('토큰 타입이 access가 아닙니다.');
    }
    return payload;
  }

  verifyRefreshToken(token) {
    const payload = jwt.verify(token, this.refreshSecret);
    if (payload.type !== 'refresh') {
      throw new jwt.JsonWebTokenError('토큰 타입이 refresh가 아닙니다.');
    }
    return payload;
  }
}

module.exports = { JwtProvider };
