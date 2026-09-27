const express = require('express');

const router = express.Router();

// GET /health : 헬스체크
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
