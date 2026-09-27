module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    // 서버 기동(listen) 엔트리는 커버리지 대상에서 제외
    '!src/server.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      lines: 80,
      functions: 80,
    },
  },
};
