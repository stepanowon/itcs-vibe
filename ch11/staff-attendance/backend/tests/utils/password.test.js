const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('password', () => {
  it('hash 후 compare하면 true를 반환한다', async () => {
    const hash = await hashPassword('secret123');
    await expect(comparePassword('secret123', hash)).resolves.toBe(true);
  });

  it('틀린 비밀번호로 compare하면 false를 반환한다', async () => {
    const hash = await hashPassword('secret123');
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
