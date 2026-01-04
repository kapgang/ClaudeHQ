const express = require('express');
const router = express.Router();
const tradeService = require('../services/tradeService');
const limitService = require('../services/limitService');

// GET /api/trades/queue - Get pending approval queue
router.get('/queue', async (req, res) => {
  try {
    const queue = await tradeService.getQueuedTrades();

    res.json({
      success: true,
      count: queue.length,
      queue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/trades/approve/:id - Approve and execute queued trade
router.post('/approve/:id', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount required'
      });
    }

    const result = await tradeService.approveQueuedTrade(req.params.id, amount);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/trades/reject/:id - Reject queued trade
router.post('/reject/:id', async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await tradeService.rejectQueuedTrade(
      req.params.id,
      reason || 'Manually rejected'
    );

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/trades/history - Get trade history
router.get('/history', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      days: parseInt(req.query.days) || 30,
      limit: parseInt(req.query.limit) || 100
    };

    const trades = await tradeService.getTradeHistory(filters);

    res.json({
      success: true,
      count: trades.length,
      trades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/trades/stats - Get trading statistics
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const stats = await tradeService.getTradeStats(days);
    const dailyStats = limitService.getDailyStats();
    const limits = await limitService.checkDailyLimits();

    res.json({
      success: true,
      stats,
      daily: dailyStats,
      limits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
