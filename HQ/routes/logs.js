const express = require('express');
const { getLogs, clearLogs, addLog } = require('../services/logger');

const router = express.Router();

// Get console logs
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ logs: getLogs(limit) });
});

// Clear logs
router.post('/clear', (req, res) => {
  clearLogs();
  res.json({ success: true });
});

module.exports = router;
