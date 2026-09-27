const { UnauthorizedError, ForbiddenError } = require('../../errors/AppError');
const { requireFields } = require('../../utils/validate');
const { comparePassword } = require('../../utils/password');
const { issueTokenPair } = require('../../utils/jwt');

function createLoginUsecase({ userRepository }) {
  return {
    async execute({ email, password }) {
      requireFields({ email, password }, ['email', 'password']);

      const user = await userRepository.findByEmail(email);
      const passwordMatches = user ? await comparePassword(password, user.password_hash) : false;

      if (!user || !passwordMatches) {
        console.log(`[login] 로그인 실패: ${email}`);
        throw new UnauthorizedError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다');
      }

      if (user.status === 'inactive') {
        console.log(`[login] 로그인 실패(비활성 계정): ${email}`);
        throw new ForbiddenError('INACTIVE_ACCOUNT', '비활성화된 계정입니다');
      }

      console.log(`[login] 로그인 성공: ${email}`);
      return issueTokenPair({ userId: user.id, role: user.role });
    },
  };
}

module.exports = { createLoginUsecase };
