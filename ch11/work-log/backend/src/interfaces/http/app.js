const express = require('express');
const cors = require('cors');
const env = require('../../infrastructure/config/env');
const { NotFoundError } = require('../../domain/errors/AppError');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const workLogRoutes = require('./routes/workLogRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/work-logs', workLogRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => next(new NotFoundError('요청한 경로를 찾을 수 없습니다.')));

app.use(errorHandler);

module.exports = app;
