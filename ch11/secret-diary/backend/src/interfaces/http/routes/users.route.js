const express = require('express');
const { pool } = require('../../../infrastructure/db/pool');
const { PgUserRepository } = require('../../../infrastructure/repositories/PgUserRepository');
const {
  PgRefreshTokenRepository,
} = require('../../../infrastructure/repositories/PgRefreshTokenRepository');
const { PgTagRepository } = require('../../../infrastructure/repositories/PgTagRepository');
const { PgDiaryRepository } = require('../../../infrastructure/repositories/PgDiaryRepository');
const { BcryptHasher } = require('../../../infrastructure/security/BcryptHasher');
const { GetMyProfileUseCase } = require('../../../application/users/GetMyProfileUseCase');
const { ChangePasswordUseCase } = require('../../../application/users/ChangePasswordUseCase');
const { validate } = require('../middlewares/validate');
const { authGuard } = require('../middlewares/authGuard');
const { asyncHandler } = require('../asyncHandler');
const { passwordChangeSchema } = require('../schemas/user.schema');

const userRepository = new PgUserRepository(pool);
const refreshTokenRepository = new PgRefreshTokenRepository(pool);
const diaryRepository = new PgDiaryRepository(pool, new PgTagRepository());
const passwordHasher = new BcryptHasher();

const getMyProfileUseCase = new GetMyProfileUseCase(userRepository, diaryRepository);
const changePasswordUseCase = new ChangePasswordUseCase(
  userRepository,
  passwordHasher,
  refreshTokenRepository
);

const router = express.Router();

router.use(authGuard);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const profile = await getMyProfileUseCase.execute(req.user.id);
    res.status(200).json(profile);
  })
);

router.put(
  '/me/password',
  validate(passwordChangeSchema),
  asyncHandler(async (req, res) => {
    await changePasswordUseCase.execute({ userId: req.user.id, ...req.body });
    res.status(204).send();
  })
);

module.exports = router;
