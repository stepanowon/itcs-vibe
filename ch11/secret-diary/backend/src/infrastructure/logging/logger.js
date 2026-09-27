// 기본 로거: 타임스탬프 + 레벨 형식으로 콘솔에 출력한다.
function format(level, message) {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

const logger = {
  info: (message) => console.log(format('INFO', message)),
  warn: (message) => console.warn(format('WARN', message)),
  error: (message) => console.error(format('ERROR', message)),
  // morgan HTTP 로그를 위한 스트림
  stream: {
    write: (message) => console.log(format('HTTP', message.trim())),
  },
};

module.exports = { logger };
