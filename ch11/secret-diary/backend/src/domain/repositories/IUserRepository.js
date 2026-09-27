// User 리포지토리 인터페이스 (의존성 역전: UseCase는 이 인터페이스에만 의존한다)
class IUserRepository {
  async findById(_id) {
    throw new Error('Not implemented');
  }

  async findByEmail(_email) {
    throw new Error('Not implemented');
  }

  async findByUsername(_username) {
    throw new Error('Not implemented');
  }

  async create(_user) {
    throw new Error('Not implemented');
  }

  async updatePasswordHash(_id, _passwordHash) {
    throw new Error('Not implemented');
  }
}

module.exports = { IUserRepository };
