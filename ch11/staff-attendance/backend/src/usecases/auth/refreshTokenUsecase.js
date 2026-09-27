const { UnauthorizedError } = require('../../errors/AppError');
const { requireFields } = require('../../utils/validate');
const { verifyRefreshToken, issueTokenPair } = require('../../utils/jwt');

function createRefreshTokenUsecase({ userRepository }) {
  return {
    async execute({ refreshToken }) {
      requireFields({ refreshToken }, ['refreshToken']);

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (err) {
        console.log('[refresh] 토큰 재발급 실패: 유효하지 않은 토큰');
        throw new UnauthorizedError('INVALID_TOKEN', '유효하지 않은 토큰입니다');
      }

      const user = await userRepository.findById(payload.userId);
      if (!user) {
        console.log(`[refresh] 토큰 재발급 실패: 존재하지 않는 사용자 userId=${payload.userId}`);
        throw new UnauthorizedError('INVALID_TOKEN', '유효하지 않은 토큰입니다');
      }

      console.log(`[refresh] 토큰 재발급 성공: userId=${user.id}`);
      return issueTokenPair({ userId: user.id, role: user.role });
    },
  };
}

module.exports = { createRefreshTokenUsecase };
