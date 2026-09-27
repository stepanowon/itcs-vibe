const { UnauthorizedError } = require('../../domain/errors/AppError');
const { hashToken } = require('../../infrastructure/security/tokenHash');

const INVALID_CREDENTIALS_MESSAGE = '이메일 또는 비밀번호가 올바르지 않습니다.';

class LoginUseCase {
  constructor(userRepository, refreshTokenRepository, passwordHasher, jwtProvider) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordHasher = passwordHasher;
    this.jwtProvider = jwtProvider;
  }

  async execute({ identifier, password }) {
    const user =
      (await this.userRepository.findByEmail(identifier)) ??
      (await this.userRepository.findByUsername(identifier));

    // 계정 없음/비밀번호 불일치 모두 동일 메시지의 401 (정보 노출 방지)
    if (!user) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
    }

    const accessToken = this.jwtProvider.signAccessToken(user.id);
    const refreshToken = this.jwtProvider.signRefreshToken(user.id);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + this.jwtProvider.refreshTtlSeconds * 1000),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtProvider.accessTtlSeconds,
    };
  }
}

module.exports = { LoginUseCase };
