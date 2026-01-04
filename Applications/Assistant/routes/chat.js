const express = require('express');
const router = express.Router();
const claudeService = require('../services/claude');

// Send a message to Claude
router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const response = await claudeService.chat(message);

  if (response.success) {
    res.json({
      message: response.message,
      usage: response.usage
    });
  } else {
    res.status(500).json({ error: response.error });
  }
});

// Get conversation history
router.get('/history', (req, res) => {
  res.json({ history: claudeService.getHistory() });
});

// Clear conversation history
router.post('/clear', (req, res) => {
  claudeService.clearHistory();
  res.json({ success: true, message: 'Conversation cleared' });
});

module.exports = router;
