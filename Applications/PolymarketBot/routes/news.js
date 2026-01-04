const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');

// GET /api/news/recent - Get recent news articles
router.get('/recent', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 50;

    const articles = await newsService.getRecentNews(hours);
    const limited = limit > 0 ? articles.slice(0, limit) : articles;

    res.json({
      success: true,
      count: limited.length,
      articles: limited
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/news/:id - Get single news article
router.get('/:id', async (req, res) => {
  try {
    const article = await newsService.getNewsById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/news/refresh - Manually trigger news fetch
router.post('/refresh', async (req, res) => {
  try {
    const articles = await newsService.fetchLatestNews();

    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/news/clear - Clear old news cache
router.delete('/clear', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await newsService.clearOldNews(days);

    res.json({
      success: result,
      message: `Cleared news older than ${days} days`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/news/status - Get polling status
router.get('/status/polling', async (req, res) => {
  try {
    const isPolling = newsService.isPolling();

    res.json({
      success: true,
      isPolling
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/news/reprocess - Reprocess all pending articles
router.post('/reprocess', async (req, res) => {
  try {
    const matchingService = require('../services/matchingService');
    const articles = await newsService.getRecentNews(24);

    // Filter for articles that are pending or haven't been processed
    const pendingArticles = articles.filter(a =>
      !a.matchStatus || a.matchStatus === 'pending' || a.matchStatus === 'error'
    );

    console.log(`Reprocessing ${pendingArticles.length} pending articles...`);

    let processed = 0;
    let errors = 0;

    for (const article of pendingArticles) {
      try {
        await matchingService.processNewsArticle(article);
        processed++;
      } catch (error) {
        console.error(`Error reprocessing article ${article.id}:`, error.message);
        errors++;
      }
    }

    res.json({
      success: true,
      totalArticles: articles.length,
      pendingArticles: pendingArticles.length,
      processed,
      errors,
      message: `Reprocessed ${processed} articles with ${errors} errors`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
