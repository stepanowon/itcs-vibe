const { pool } = require('../src/infrastructure/db/pool');
const { PgUserRepository } = require('../src/infrastructure/repositories/PgUserRepository');
const {
  PgRefreshTokenRepository,
} = require('../src/infrastructure/repositories/PgRefreshTokenRepository');

const userRepo = new PgUserRepository(pool);
const refreshTokenRepo = new PgRefreshTokenRepository(pool);

const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const testEmail = `be05-${uniqueSuffix}@example.com`;
const testUsername = `be05user${uniqueSuffix}`;

let createdUserId;

afterAll(async () => {
  if (createdUserId) {
    // users 삭제 시 refresh_tokens 등 자식 레코드는 FK CASCADE로 함께 제거된다.
    await pool.query('DELETE FROM users WHERE id = $1', [createdUserId]);
  }
  await pool.end();
});

describe('PgUserRepository', () => {
  it('create로 사용자를 생성하고 email을 소문자로 정규화한다', async () => {
    const user = await userRepo.create({
      email: testEmail.toUpperCase(),
      username: testUsername,
      passwordHash: 'hashed-value',
    });

    createdUserId = user.id;

    expect(user.id).toBeTruthy();
    expect(user.email).toBe(testEmail.toLowerCase());
    expect(user.username).toBe(testUsername);
  });

  it('findByEmail/findByUsername/findById로 조회된다', async () => {
    const byEmail = await userRepo.findByEmail(testEmail.toUpperCase());
    const byUsername = await userRepo.findByUsername(testUsername);
    const byId = await userRepo.findById(createdUserId);

    expect(byEmail.id).toBe(createdUserId);
    expect(byUsername.id).toBe(createdUserId);
    expect(byId.id).toBe(createdUserId);
  });

  it('존재하지 않는 사용자 조회 시 null을 반환한다', async () => {
    const notFound = await userRepo.findByEmail('no-such-user@example.com');
    expect(notFound).toBeNull();
  });

  it('updatePasswordHash로 비밀번호 해시가 갱신된다', async () => {
    await userRepo.updatePasswordHash(createdUserId, 'new-hashed-value');
    const updated = await userRepo.findById(createdUserId);
    expect(updated.passwordHash).toBe('new-hashed-value');
  });
});

describe('PgRefreshTokenRepository', () => {
  const tokenHash = `token-hash-${uniqueSuffix}`;

  it('create/findByTokenHash로 저장·조회된다', async () => {
    const created = await refreshTokenRepo.create({
      userId: createdUserId,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    expect(created.tokenHash).toBe(tokenHash);
    expect(created.revoked).toBe(false);

    const found = await refreshTokenRepo.findByTokenHash(tokenHash);
    expect(found.userId).toBe(createdUserId);
  });

  it('revokeByTokenHash로 무효화된다', async () => {
    await refreshTokenRepo.revokeByTokenHash(tokenHash);
    const found = await refreshTokenRepo.findByTokenHash(tokenHash);
    expect(found.revoked).toBe(true);
  });

  it('revokeAllByUserId로 사용자의 모든 토큰이 무효화된다', async () => {
    const anotherHash = `token-hash-2-${uniqueSuffix}`;
    await refreshTokenRepo.create({
      userId: createdUserId,
      tokenHash: anotherHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await refreshTokenRepo.revokeAllByUserId(createdUserId);

    const found = await refreshTokenRepo.findByTokenHash(anotherHash);
    expect(found.revoked).toBe(true);
  });
});
