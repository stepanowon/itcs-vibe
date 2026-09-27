const { Router } = require('express');

function createHealthRouter(healthController) {
  const router = Router();
  router.get('/health', healthController);
  return router;
}

module.exports = { createHealthRouter };
