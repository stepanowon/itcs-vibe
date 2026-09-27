const { z } = require('zod');

const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  username: z
    .string()
    .min(2, '사용자명은 2자 이상이어야 합니다.')
    .max(50, '사용자명은 50자 이하여야 합니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'email 또는 username을 입력하세요.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken이 필요합니다.'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken이 필요합니다.'),
});

module.exports = { signupSchema, loginSchema, refreshSchema, logoutSchema };
