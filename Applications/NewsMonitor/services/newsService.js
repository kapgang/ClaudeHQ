const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('./dataStore');

class NewsService {
  constructor() {
    this.pollingInterval = null;
    this.seenArticles = new Set();
    this.loadSeenArticles();
  }

  loadSeenArticles() {
    const articles = dataStore.getNews({ hours: 168 }); // Last 7 days
    articles.forEach(article => {
      const hash = this.getArticleHash(article);
      this.seenArticles.add(hash);
    });
    console.log(`Loaded ${this.seenArticles.size} seen articles into cache`);
  }

  getArticleHash(article) {
    return `${article.title}:${article.source?.name || article.source}:${article.publishedAt}`;
  }

  async startPolling() {
    const settings = dataStore.getSettings();

    if (!settings.newsApi.enabled || !settings.newsApi.apiKey) {
      console.log('NewsAPI is disabled or not configured');
      return;
    }

    console.log(`Starting news polling every ${settings.newsApi.pollingInterval / 1000}s`);

    // Fetch immediately
    await this.fetchLatestNews();

    // Then poll at interval
    this.pollingInterval = setInterval(async () => {
      await this.fetchLatestNews();
    }, settings.newsApi.pollingInterval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('News polling stopped');
    }
  }

  async fetchLatestNews() {
    const settings = dataStore.getSettings();

    if (!settings.newsApi.enabled || !settings.newsApi.apiKey) {
      return [];
    }

    try {
      const keywords = settings.newsApi.keywords.join(' OR ');
      const sources = settings.newsApi.sources.join(',');

      const params = {
        q: keywords,
        sources: sources,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: settings.newsApi.maxArticlesPerPoll,
        apiKey: settings.newsApi.apiKey
      };

      console.log(`Fetching news for: ${keywords}`);

      const response = await axios.get('https://newsapi.org/v2/everything', { params });

      if (response.data.status === 'ok') {
        const articles = response.data.articles || [];
        console.log(`Fetched ${articles.length} articles from NewsAPI`);

        const newArticles = await this.saveArticles(articles);
        console.log(`${newArticles.length} new articles added`);

        // Trigger matching for new articles
        if (newArticles.length > 0) {
          const matchingService = require('./matchingService');
          for (const article of newArticles) {
            await matchingService.processNewsArticle(article);
          }
        }

        return newArticles;
      } else {
        console.error('NewsAPI returned error:', response.data);
        return [];
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('NewsAPI rate limit exceeded, pausing polling');
        this.stopPolling();
        // Resume after 1 hour
        setTimeout(() => this.startPolling(), 3600000);
      } else if (error.response?.status === 401) {
        console.error('NewsAPI authentication failed - check API key');
        this.stopPolling();
      } else {
        console.error('Error fetching news:', error.message);
      }
      return [];
    }
  }

  async saveArticles(articles) {
    const newArticles = [];

    for (const article of articles) {
      const hash = this.getArticleHash(article);

      if (!this.seenArticles.has(hash)) {
        const processedArticle = {
          id: uuidv4(),
          title: article.title,
          description: article.description || article.content || '',
          url: article.url,
          source: article.source?.name || article.source,
          publishedAt: article.publishedAt,
          urlToImage: article.urlToImage,
          content: article.content,
          matchedMarkets: 0,
          fetchedAt: new Date().toISOString()
        };

        dataStore.saveNewsArticle(processedArticle);
        this.seenArticles.add(hash);
        newArticles.push(processedArticle);
      }
    }

    return newArticles;
  }

  async getRecentNews(hours = 24) {
    return dataStore.getNews({ hours });
  }

  async clearOldNews(days = 7) {
    const result = dataStore.clearOldNews(days);
    if (result) {
      // Reload seen articles cache
      this.seenArticles.clear();
      this.loadSeenArticles();
    }
    return result;
  }

  async getNewsById(id) {
    const allNews = dataStore.getNews({});
    return allNews.find(n => n.id === id);
  }

  isPolling() {
    return this.pollingInterval !== null;
  }
}

module.exports = new NewsService();
