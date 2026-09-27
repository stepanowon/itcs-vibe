const jwt = require('jsonwebtoken');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');

function signAccessToken({ userId, role }) {
  return jwt.sign({ userId, role }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken({ userId, role }) {
  return jwt.sign({ userId, role }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  const { userId, role } = jwt.verify(token, JWT_ACCESS_SECRET);
  return { userId, role };
}

function verifyRefreshToken(token) {
  const { userId, role } = jwt.verify(token, JWT_REFRESH_SECRET);
  return { userId, role };
}

function getAccessTokenExpiresInSeconds() {
  const match = /^(\d+)([smhd])$/.exec(JWT_ACCESS_EXPIRES_IN);
  if (!match) return 43200;

  const value = Number(match[1]);
  const unitSeconds = { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
  return value * unitSeconds;
}

/** Access/Refresh Token을 함께 발급해 TokenResponse 형태로 반환한다. */
function issueTokenPair({ userId, role }) {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId, role }),
    tokenType: 'Bearer',
    expiresIn: getAccessTokenExpiresInSeconds(),
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiresInSeconds,
  issueTokenPair,
};
