// BE-20: 실제 API 응답이 docs/4-swagger.json 명세(스키마)와 일치하는지 검증한다.
const path = require('path');
const request = require('supertest');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const swaggerDoc = require('../../docs/4-swagger.json');
const { createApp } = require('../src/interfaces/http/app');
const { pool } = require('../src/infrastructure/db/pool');

const app = createApp();

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
ajv.addSchema(swaggerDoc, 'swagger');

function schemaValidator(schemaName) {
  return ajv.compile({ $ref: `swagger#/components/schemas/${schemaName}` });
}

const validators = {
  UserProfile: schemaValidator('UserProfile'),
  UserProfileWithStats: schemaValidator('UserProfileWithStats'),
  TokenPair: schemaValidator('TokenPair'),
  Diary: schemaValidator('Diary'),
  DiaryListResponse: schemaValidator('DiaryListResponse'),
  Error: schemaValidator('Error'),
};

function expectValid(schemaName, data) {
  const validate = validators[schemaName];
  const ok = validate(data);
  if (!ok) {
    throw new Error(
      `${schemaName} 스키마 불일치:\n${JSON.stringify(validate.errors, null, 2)}\n실제 응답: ${JSON.stringify(data)}`
    );
  }
}

const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const email = `be20-contract-${uniqueSuffix}@example.com`;
const username = `be20contract${uniqueSuffix}`;
const password = 'P@ssw0rd!';

let accessToken;
let createdDiaryId;

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.end();
});

describe('4-swagger.json 문서 스키마 자체가 로드 가능하다', () => {
  it('openapi 문서를 파일 시스템에서 읽을 수 있다', () => {
    expect(swaggerDoc.openapi).toBe('3.0.3');
    expect(path.basename(require.resolve('../../docs/4-swagger.json'))).toBe('4-swagger.json');
  });
});

describe('POST /api/v1/auth/signup 응답이 UserProfile 스키마와 일치한다', () => {
  it('201 응답 바디가 UserProfile 스키마를 만족한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email, username, password });

    expect(res.status).toBe(201);
    expectValid('UserProfile', res.body);
  });

  it('409 응답 바디가 Error 스키마를 만족한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email, username, password });

    expect(res.status).toBe(409);
    expectValid('Error', res.body);
  });
});

describe('POST /api/v1/auth/login 응답이 TokenPair 스키마와 일치한다', () => {
  it('200 응답 바디가 TokenPair 스키마를 만족한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password });

    expect(res.status).toBe(200);
    expectValid('TokenPair', res.body);
    accessToken = res.body.accessToken;
  });

  it('401 응답 바디가 Error 스키마를 만족한다', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password: 'wrong' });

    expect(res.status).toBe(401);
    expectValid('Error', res.body);
  });
});

describe('POST /api/v1/diaries 응답이 Diary 스키마와 일치한다', () => {
  it('201 응답 바디가 Diary 스키마를 만족한다', async () => {
    const res = await request(app)
      .post('/api/v1/diaries')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '계약 검증용 일기',
        content: '본문',
        weather: 'sunny',
        mood: 'happy',
        tags: ['계약테스트'],
      });

    expect(res.status).toBe(201);
    expectValid('Diary', res.body);
    createdDiaryId = res.body.id;
  });
});

describe('GET /api/v1/diaries 응답이 DiaryListResponse 스키마와 일치한다', () => {
  it('200 응답 바디가 DiaryListResponse 스키마를 만족한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expectValid('DiaryListResponse', res.body);
  });
});

describe('GET /api/v1/diaries/:id 응답이 Diary 스키마와 일치한다', () => {
  it('200 응답 바디가 Diary 스키마를 만족한다', async () => {
    const res = await request(app)
      .get(`/api/v1/diaries/${createdDiaryId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expectValid('Diary', res.body);
  });

  it('404 응답 바디가 Error 스키마를 만족한다', async () => {
    const res = await request(app)
      .get('/api/v1/diaries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expectValid('Error', res.body);
  });
});

describe('GET /api/v1/users/me 응답이 UserProfileWithStats 스키마와 일치한다', () => {
  it('200 응답 바디가 UserProfileWithStats 스키마를 만족한다(diaryCount 포함)', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expectValid('UserProfileWithStats', res.body);
  });
});
