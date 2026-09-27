// Diary 리포지토리 인터페이스
class IDiaryRepository {
  async create(_diary) {
    throw new Error('Not implemented');
  }

  async findById(_id) {
    throw new Error('Not implemented');
  }

  async list(_query) {
    throw new Error('Not implemented');
  }

  async updateById(_id, _userId, _fields) {
    throw new Error('Not implemented');
  }

  async deleteById(_id, _userId) {
    throw new Error('Not implemented');
  }

  async countByUserId(_userId) {
    throw new Error('Not implemented');
  }
}

module.exports = { IDiaryRepository };
