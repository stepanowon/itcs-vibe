const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
