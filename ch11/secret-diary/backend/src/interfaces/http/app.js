const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { config } = require('../../infrastructure/config/env');
const { logger } = require('../../infrastructure/logging/logger');
const swaggerDocument = require('../../../../docs/4-swagger.json');
const healthRouter = require('./routes/health.route');
const authRouter = require('./routes/auth.route');
const diariesRouter = require('./routes/diaries.route');
const usersRouter = require('./routes/users.route');
const { notFoundHandler } = require('./middlewares/notFoundHandler');
const { errorHandler } = require('./middlewares/errorHandler');

const API_PREFIX = '/api/v1';
const SWAGGER_UI_PATH = '/api-docs';

// Express 애플리케이션을 생성한다. (테스트에서 재사용하기 위해 listen과 분리)
function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json());
  app.use(morgan('tiny', { stream: logger.stream }));

  app.use('/health', healthRouter);
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/diaries`, diariesRouter);
  app.use(`${API_PREFIX}/users`, usersRouter);

  app.use(SWAGGER_UI_PATH, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
