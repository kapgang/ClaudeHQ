const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const polymarketService = require('../services/polymarketService');

// GET /api/markets/active - Get all active matches
router.get('/active', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const matches = await matchingService.getActiveMatches(limit);

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/markets/search - Manual market search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || req.query.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required'
      });
    }

    const markets = await polymarketService.searchMarkets(query);

    res.json({
      success: true,
      count: markets.length,
      markets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/markets/rematch/:newsId - Re-run matching for a news article
router.post('/rematch/:newsId', async (req, res) => {
  try {
    const result = await matchingService.rematchNewsArticle(req.params.newsId);

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

module.exports = router;
