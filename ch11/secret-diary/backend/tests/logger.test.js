const { logger } = require('../src/infrastructure/logging/logger');

describe('logger (기본 로깅)', () => {
  it('info/warn/error 및 morgan stream.write 가 콘솔에 출력한다', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    logger.info('정보 메시지');
    logger.warn('경고 메시지');
    logger.error('오류 메시지');
    logger.stream.write('GET /health 200\n');

    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
