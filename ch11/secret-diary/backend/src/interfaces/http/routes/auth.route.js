const express = require('express');
const { pool } = require('../../../infrastructure/db/pool');
const { PgUserRepository } = require('../../../infrastructure/repositories/PgUserRepository');
const {
  PgRefreshTokenRepository,
} = require('../../../infrastructure/repositories/PgRefreshTokenRepository');
const { BcryptHasher } = require('../../../infrastructure/security/BcryptHasher');
const { SignupUseCase } = require('../../../application/auth/SignupUseCase');
const { LoginUseCase } = require('../../../application/auth/LoginUseCase');
const { RefreshUseCase } = require('../../../application/auth/RefreshUseCase');
const { LogoutUseCase } = require('../../../application/auth/LogoutUseCase');
const { validate } = require('../middlewares/validate');
const { authGuard, jwtProvider } = require('../middlewares/authGuard');
const { asyncHandler } = require('../asyncHandler');
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require('../schemas/auth.schema');

const userRepository = new PgUserRepository(pool);
const refreshTokenRepository = new PgRefreshTokenRepository(pool);
const passwordHasher = new BcryptHasher();

const signupUseCase = new SignupUseCase(userRepository, passwordHasher);
const loginUseCase = new LoginUseCase(
  userRepository,
  refreshTokenRepository,
  passwordHasher,
  jwtProvider
);
const refreshUseCase = new RefreshUseCase(refreshTokenRepository, jwtProvider);
const logoutUseCase = new LogoutUseCase(refreshTokenRepository);

const router = express.Router();

router.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const profile = await signupUseCase.execute(req.body);
    res.status(201).json(profile);
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const tokens = await loginUseCase.execute(req.body);
    res.status(200).json(tokens);
  })
);

router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await refreshUseCase.execute(req.body.refreshToken);
    res.status(200).json(tokens);
  })
);

router.post(
  '/logout',
  authGuard,
  validate(logoutSchema),
  asyncHandler(async (req, res) => {
    await logoutUseCase.execute({ refreshToken: req.body.refreshToken, userId: req.user.id });
    res.status(204).send();
  })
);

module.exports = router;
