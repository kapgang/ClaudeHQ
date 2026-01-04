const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');
const newsService = require('../services/newsService');
const polymarketService = require('../services/polymarketService');
const claudeService = require('../services/claudeService');

// GET /api/settings - Get all settings (with sanitized API keys)
router.get('/', async (req, res) => {
  try {
    const settings = dataStore.getSettings();

    // Sanitize API keys - show only last 4 characters
    const sanitized = JSON.parse(JSON.stringify(settings));

    if (sanitized.newsApi.apiKey) {
      const key = sanitized.newsApi.apiKey;
      sanitized.newsApi.apiKey = key.length > 4 ? '***' + key.slice(-4) : '***';
    }

    if (sanitized.polymarket.apiKey) {
      const key = sanitized.polymarket.apiKey;
      sanitized.polymarket.apiKey = key.length > 4 ? '***' + key.slice(-4) : '***';
    }

    if (sanitized.polymarket.privateKey) {
      const key = sanitized.polymarket.privateKey;
      sanitized.polymarket.privateKey = key.length > 4 ? '***' + key.slice(-4) : '***';
    }

    if (sanitized.claude.apiKey) {
      const key = sanitized.claude.apiKey;
      sanitized.claude.apiKey = key.length > 4 ? '***' + key.slice(-4) : '***';
    }

    res.json({
      success: true,
      settings: sanitized
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/settings/news - Update NewsAPI settings
router.put('/news', async (req, res) => {
  try {
    const result = dataStore.updateSettings('newsApi', req.body);

    // Restart polling if settings changed
    if (result && req.body.enabled) {
      newsService.stopPolling();
      await newsService.startPolling();
    } else if (result && req.body.enabled === false) {
      newsService.stopPolling();
    }

    res.json({
      success: result,
      message: result ? 'NewsAPI settings updated' : 'Failed to update settings'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/settings/polymarket - Update Polymarket settings
router.put('/polymarket', async (req, res) => {
  try {
    const result = dataStore.updateSettings('polymarket', req.body);

    res.json({
      success: result,
      message: result ? 'Polymarket settings updated' : 'Failed to update settings'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/settings/claude - Update Claude settings
router.put('/claude', async (req, res) => {
  try {
    const result = dataStore.updateSettings('claude', req.body);

    // Reinitialize Claude client if API key changed
    if (result && req.body.apiKey) {
      claudeService.initializeClient();
    }

    res.json({
      success: result,
      message: result ? 'Claude settings updated' : 'Failed to update settings'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/settings/limits - Update trading limits
router.put('/limits', async (req, res) => {
  try {
    const result = dataStore.updateSettings('tradingLimits', req.body);

    res.json({
      success: result,
      message: result ? 'Trading limits updated' : 'Failed to update settings'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/settings/test-connection - Test API connections
router.post('/test-connection', async (req, res) => {
  try {
    const results = {
      news: 'not_configured',
      polymarket: 'not_configured',
      claude: 'not_configured'
    };

    // Test NewsAPI
    try {
      const settings = dataStore.getSettings();
      if (settings.newsApi.apiKey && settings.newsApi.enabled) {
        await newsService.fetchLatestNews();
        results.news = 'ok';
      }
    } catch (error) {
      results.news = 'error: ' + error.message;
    }

    // Test Polymarket
    try {
      if (polymarketService.isEnabled()) {
        await polymarketService.searchMarkets(['test']);
        results.polymarket = 'ok';
      }
    } catch (error) {
      results.polymarket = 'error: ' + error.message;
    }

    // Test Claude
    try {
      const settings = dataStore.getSettings();
      if (settings.claude.apiKey && settings.claude.enabled) {
        claudeService.initializeClient();
        results.claude = 'ok';
      }
    } catch (error) {
      results.claude = 'error: ' + error.message;
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
