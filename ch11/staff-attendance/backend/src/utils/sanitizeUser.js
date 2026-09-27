// 응답에 절대 노출하면 안 되는 password_hash를 제거한다.
function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

function sanitizeUsers(users) {
  return users.map(sanitizeUser);
}

module.exports = { sanitizeUser, sanitizeUsers };
