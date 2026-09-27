// Tag 리포지토리 인터페이스
class ITagRepository {
  // client: 호출측 트랜잭션의 pg PoolClient (diary 생성/수정과 원자적으로 묶기 위함)
  async upsertMany(_client, _userId, _names) {
    throw new Error('Not implemented');
  }
}

module.exports = { ITagRepository };
