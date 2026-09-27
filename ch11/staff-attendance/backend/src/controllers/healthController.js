function createHealthController(checkHealthUsecase) {
  return async function healthController(req, res) {
    console.log('[health] 헬스체크 요청 수신');
    try {
      const result = await checkHealthUsecase.execute();
      res.status(200).json({ ...result, timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'error', db: 'disconnected' });
    }
  };
}

module.exports = { createHealthController };
