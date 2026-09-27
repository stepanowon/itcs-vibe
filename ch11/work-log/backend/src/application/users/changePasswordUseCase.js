const userRepository = require('../../infrastructure/repositories/UserRepository');
const { hashPassword, comparePassword } = require('../../infrastructure/security/password');
const { ValidationError } = require('../../domain/errors/AppError');

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError('패스워드는 8자 이상이어야 합니다.');
  }
  const user = await userRepository.findById(userId);
  const matched = await comparePassword(currentPassword, user.passwordHash);
  if (!matched) {
    throw new ValidationError('기존 패스워드가 일치하지 않습니다.');
  }
  const newHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newHash);
}

module.exports = changePassword;
