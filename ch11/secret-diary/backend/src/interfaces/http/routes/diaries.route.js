const express = require('express');
const { pool } = require('../../../infrastructure/db/pool');
const { PgDiaryRepository } = require('../../../infrastructure/repositories/PgDiaryRepository');
const { PgTagRepository } = require('../../../infrastructure/repositories/PgTagRepository');
const { CreateDiaryUseCase } = require('../../../application/diaries/CreateDiaryUseCase');
const { ListDiariesUseCase } = require('../../../application/diaries/ListDiariesUseCase');
const { GetDiaryUseCase } = require('../../../application/diaries/GetDiaryUseCase');
const { UpdateDiaryUseCase } = require('../../../application/diaries/UpdateDiaryUseCase');
const { DeleteDiaryUseCase } = require('../../../application/diaries/DeleteDiaryUseCase');
const { validate } = require('../middlewares/validate');
const { authGuard } = require('../middlewares/authGuard');
const { asyncHandler } = require('../asyncHandler');
const {
  diaryCreateSchema,
  diaryListQuerySchema,
  diaryIdParamsSchema,
} = require('../schemas/diary.schema');

const tagRepository = new PgTagRepository();
const diaryRepository = new PgDiaryRepository(pool, tagRepository);

const createDiaryUseCase = new CreateDiaryUseCase(diaryRepository);
const listDiariesUseCase = new ListDiariesUseCase(diaryRepository);
const getDiaryUseCase = new GetDiaryUseCase(diaryRepository);
const updateDiaryUseCase = new UpdateDiaryUseCase(diaryRepository);
const deleteDiaryUseCase = new DeleteDiaryUseCase(diaryRepository);

const router = express.Router();

router.use(authGuard);

router.get(
  '/',
  validate(diaryListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await listDiariesUseCase.execute({ userId: req.user.id, ...req.query });
    res.status(200).json(result);
  })
);

router.post(
  '/',
  validate(diaryCreateSchema),
  asyncHandler(async (req, res) => {
    const diary = await createDiaryUseCase.execute({ userId: req.user.id, ...req.body });
    res.status(201).json(diary);
  })
);

router.get(
  '/:id',
  validate(diaryIdParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const diary = await getDiaryUseCase.execute({ id: req.params.id, userId: req.user.id });
    res.status(200).json(diary);
  })
);

router.put(
  '/:id',
  validate(diaryIdParamsSchema, 'params'),
  validate(diaryCreateSchema),
  asyncHandler(async (req, res) => {
    const diary = await updateDiaryUseCase.execute({
      id: req.params.id,
      userId: req.user.id,
      ...req.body,
    });
    res.status(200).json(diary);
  })
);

router.delete(
  '/:id',
  validate(diaryIdParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    await deleteDiaryUseCase.execute({ id: req.params.id, userId: req.user.id });
    res.status(204).send();
  })
);

module.exports = router;
