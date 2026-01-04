const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DataStore {
  // Generic JSON file operations
  loadJSON(filename) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    try {
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
      return null;
    }
  }

  saveJSON(filename, data) {
    const filepath = path.join(DATA_DIR, filename);
    try {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`Error saving ${filename}:`, error);
      return false;
    }
  }

  // News operations
  getNews(filters = {}) {
    const data = this.loadJSON('news.json') || { articles: [], lastUpdate: null };
    let articles = data.articles || [];

    // Filter by hours
    if (filters.hours) {
      const cutoff = Date.now() - (filters.hours * 60 * 60 * 1000);
      articles = articles.filter(a => new Date(a.publishedAt).getTime() > cutoff);
    }

    // Limit results
    if (filters.limit) {
      articles = articles.slice(0, filters.limit);
    }

    return articles;
  }

  saveNewsArticle(article) {
    const data = this.loadJSON('news.json') || { articles: [], lastUpdate: null };
    data.articles.push(article);
    data.lastUpdate = new Date().toISOString();
    return this.saveJSON('news.json', data);
  }

  saveNewsArticles(articles) {
    const data = this.loadJSON('news.json') || { articles: [], lastUpdate: null };
    data.articles.push(...articles);
    data.lastUpdate = new Date().toISOString();
    return this.saveJSON('news.json', data);
  }

  clearOldNews(days = 7) {
    const data = this.loadJSON('news.json') || { articles: [], lastUpdate: null };
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    data.articles = data.articles.filter(a => new Date(a.publishedAt).getTime() > cutoff);
    return this.saveJSON('news.json', data);
  }

  // Market operations
  getMatches(filters = {}) {
    const data = this.loadJSON('markets.json') || { matches: [] };
    let matches = data.matches || [];

    if (filters.status) {
      matches = matches.filter(m => m.status === filters.status);
    }

    if (filters.limit) {
      matches = matches.slice(0, filters.limit);
    }

    return matches;
  }

  saveMatch(match) {
    const data = this.loadJSON('markets.json') || { matches: [] };
    data.matches.push(match);
    return this.saveJSON('markets.json', data);
  }

  updateMatchStatus(id, status) {
    const data = this.loadJSON('markets.json') || { matches: [] };
    const match = data.matches.find(m => m.id === id);
    if (match) {
      match.status = status;
      match.updatedAt = new Date().toISOString();
      return this.saveJSON('markets.json', data);
    }
    return false;
  }

  // Trade operations
  getTrades(filters = {}) {
    const data = this.loadJSON('trades.json') || { trades: [], stats: {} };
    let trades = data.trades || [];

    if (filters.status) {
      trades = trades.filter(t => t.status === filters.status);
    }

    if (filters.days) {
      const cutoff = Date.now() - (filters.days * 24 * 60 * 60 * 1000);
      trades = trades.filter(t => new Date(t.executedAt).getTime() > cutoff);
    }

    if (filters.limit) {
      trades = trades.slice(0, filters.limit);
    }

    return trades;
  }

  saveTrade(trade) {
    const data = this.loadJSON('trades.json') || { trades: [], stats: {} };
    data.trades.push(trade);
    return this.saveJSON('trades.json', data);
  }

  updateTrade(id, updates) {
    const data = this.loadJSON('trades.json') || { trades: [], stats: {} };
    const trade = data.trades.find(t => t.id === id);
    if (trade) {
      Object.assign(trade, updates);
      trade.updatedAt = new Date().toISOString();
      return this.saveJSON('trades.json', data);
    }
    return false;
  }

  getTradeStats(days = 30) {
    const trades = this.getTrades({ days });
    const stats = {
      total: trades.length,
      executed: trades.filter(t => t.status === 'executed').length,
      pending: trades.filter(t => t.status === 'pending').length,
      rejected: trades.filter(t => t.status === 'rejected').length,
      totalAmount: trades.reduce((sum, t) => sum + (t.amount || 0), 0),
      avgConfidence: trades.length > 0
        ? trades.reduce((sum, t) => sum + (t.confidence || 0), 0) / trades.length
        : 0
    };
    return stats;
  }

  // Queue operations
  getQueuedTrades() {
    const data = this.loadJSON('queue.json') || { pending: [] };
    return data.pending || [];
  }

  addToQueue(trade) {
    const data = this.loadJSON('queue.json') || { pending: [] };
    data.pending.push(trade);
    return this.saveJSON('queue.json', data);
  }

  removeFromQueue(id) {
    const data = this.loadJSON('queue.json') || { pending: [] };
    data.pending = data.pending.filter(t => t.id !== id);
    return this.saveJSON('queue.json', data);
  }

  getQueuedTradeById(id) {
    const data = this.loadJSON('queue.json') || { pending: [] };
    return data.pending.find(t => t.id === id);
  }

  // Settings operations
  getSettings() {
    return this.loadJSON('settings.json') || this.getDefaultSettings();
  }

  updateSettings(section, updates) {
    const settings = this.getSettings();
    if (settings[section]) {
      Object.assign(settings[section], updates);
      return this.saveJSON('settings.json', settings);
    }
    return false;
  }

  getDefaultSettings() {
    return {
      newsApi: {
        apiKey: '',
        sources: ['reuters', 'bloomberg', 'techcrunch'],
        keywords: ['election', 'sports', 'technology'],
        pollingInterval: 300000,
        maxArticlesPerPoll: 50,
        enabled: false
      },
      polymarket: {
        apiKey: '',
        privateKey: '',
        walletAddress: '',
        endpoint: 'https://gamma-api.polymarket.com',
        clobEndpoint: 'https://clob.polymarket.com',
        testMode: true,
        enabled: false
      },
      claude: {
        apiKey: '',
        model: 'claude-sonnet-4-5-20250929',
        maxTokens: 500,
        temperature: 0.3,
        confidenceThreshold: 70,
        enabled: false
      },
      tradingLimits: {
        dailyMaxUSD: 50,
        dailyMaxTrades: 10,
        maxPerTrade: 10,
        minConfidence: 70,
        resetHour: 0
      }
    };
  }
}

module.exports = new DataStore();
