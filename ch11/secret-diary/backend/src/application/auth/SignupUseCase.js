const { ConflictError } = require('../../domain/errors/AppError');

class SignupUseCase {
  constructor(userRepository, passwordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, username, password }) {
    const [existingByEmail, existingByUsername] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
    ]);

    if (existingByEmail) {
      throw new ConflictError('이미 사용 중인 이메일입니다.');
    }
    if (existingByUsername) {
      throw new ConflictError('이미 사용 중인 사용자명입니다.');
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepository.create({ email, username, passwordHash });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}

module.exports = { SignupUseCase };
