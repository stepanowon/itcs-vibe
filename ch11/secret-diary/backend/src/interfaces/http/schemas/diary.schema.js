const { z } = require('zod');

const weatherEnum = z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'windy']);
const moodEnum = z.enum(['happy', 'neutral', 'sad', 'angry', 'excited', 'tired']);

const diaryCreateSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요.').max(200, '제목은 200자 이하여야 합니다.'),
  content: z.string().min(1, '본문을 입력하세요.'),
  weather: weatherEnum.optional(),
  mood: moodEnum.optional(),
  diaryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다.')
    .optional(),
  tags: z
    .array(z.string().min(1).max(20, '태그는 20자 이하여야 합니다.'))
    .max(10, '태그는 최대 10개까지 등록할 수 있습니다.')
    .optional(),
});

const diaryListQuerySchema = z.object({
  weather: weatherEnum.optional(),
  mood: moodEnum.optional(),
  tag: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const diaryIdParamsSchema = z.object({
  id: z.string().uuid('올바른 id 형식이 아닙니다.'),
});

module.exports = { diaryCreateSchema, diaryListQuerySchema, diaryIdParamsSchema, weatherEnum, moodEnum };
