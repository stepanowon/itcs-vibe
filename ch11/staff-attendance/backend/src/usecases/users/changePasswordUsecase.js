const { BadRequestError } = require('../../errors/AppError');
const { hashPassword, comparePassword } = require('../../utils/password');
const { issueTokenPair } = require('../../utils/jwt');

function createChangePasswordUsecase({ userRepository }) {
  return {
    async execute({ userId, currentPassword, newPassword }) {
      const user = await userRepository.findById(userId);
      const matches = user ? await comparePassword(currentPassword, user.password_hash) : false;
      if (!matches) {
        console.log(`[changePassword] 현재 비밀번호 불일치: ${userId}`);
        throw new BadRequestError('INVALID_CURRENT_PASSWORD', '현재 비밀번호가 일치하지 않습니다');
      }

      if (!newPassword || newPassword.length < 8) {
        throw new BadRequestError('VALIDATION_ERROR', '비밀번호는 8자 이상이어야 합니다');
      }

      const passwordHash = await hashPassword(newPassword);
      await userRepository.updatePassword(userId, passwordHash);
      console.log(`[changePassword] 비밀번호 변경 성공: ${userId}`);

      return issueTokenPair({ userId: user.id, role: user.role });
    },
  };
}

module.exports = { createChangePasswordUsecase };
