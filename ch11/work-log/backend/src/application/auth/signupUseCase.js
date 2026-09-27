const crypto = require('crypto');
const { ValidationError, ConflictError } = require('../../domain/errors/AppError');
const { hashPassword } = require('../../infrastructure/security/password');
const userRepository = require('../../infrastructure/repositories/UserRepository');

function generateUserCode() {
  return `UC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function signup({ email, password, name, department }) {
  if (password.length < 8) {
    throw new ValidationError('패스워드는 8자 이상이어야 합니다.');
  }

  const conflict = await userRepository.findConflict({ email });
  if (conflict) {
    throw new ConflictError('이미 사용 중인 이메일입니다.');
  }

  const passwordHash = await hashPassword(password);
  const userCode = generateUserCode();

  let created;
  try {
    created = await userRepository.create({ userCode, email, passwordHash, name, department });
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictError('이미 사용 중인 이메일입니다.');
    }
    throw error;
  }

  return {
    id: created.id,
    userCode: created.userCode,
    email: created.email,
    name: created.name,
    department: created.department,
    workLogCount: 0,
    createdAt: created.createdAt,
  };
}

module.exports = signup;
