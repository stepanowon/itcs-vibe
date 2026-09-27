const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todos REST API',
      version: '1.0.0',
      description: 'Express 기반 간단한 CRUD REST API 예제 문서',
    },
    servers: [{ url: 'http://localhost:8080' }],
    components: {
      schemas: {
        Todo: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'HTTP 요청/응답 구조 학습하기' },
            done: { type: 'boolean', example: false },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'NOT_FOUND' },
            message: { type: 'string', example: 'id 1를 찾을 수 없습니다.' },
          },
        },
      },
    },
  },
  apis: ['./server.js'],
};

module.exports = swaggerJsdoc(options);
