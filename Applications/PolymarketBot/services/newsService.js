const axios = require('axios');
const crypto = require('crypto');
const dataStore = require('./dataStore');
const Parser = require('rss-parser');

class NewsService {
  constructor() {
    this.pollingInterval = null;
    this.seenArticles = new Set();
    this.rssParser = new Parser();
    this.loadSeenArticles();

    // Free RSS feeds configuration
    this.rssFeeds = {
      reuters: 'https://news.google.com/rss/search?q=reuters&hl=en-US&gl=US&ceid=US:en',
      techcrunch: 'https://techcrunch.com/feed/',
      bbc: 'http://feeds.bbci.co.uk/news/rss.xml',
      cnn: 'http://rss.cnn.com/rss/cnn_topstories.rss',
      npr: 'https://feeds.npr.org/1001/rss.xml',
      apnews: 'https://apnews.com/index.rss',
      theverge: 'https://www.theverge.com/rss/index.xml',
      wired: 'https://www.wired.com/feed/rss',
      ars: 'https://feeds.arstechnica.com/arstechnica/index'
    };
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

    if (!settings.newsApi.enabled) {
      console.log('News service is disabled');
      return;
    }

    // Check if proper configuration based on source type
    if (settings.newsApi.sourceType === 'newsapi' && !settings.newsApi.apiKey) {
      console.log('NewsAPI selected but no API key configured');
      return;
    }

    console.log(`Starting ${settings.newsApi.sourceType.toUpperCase()} news polling every ${settings.newsApi.pollingInterval / 1000}s`);

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

    if (!settings.newsApi.enabled) {
      return [];
    }

    // Route to appropriate fetcher based on source type
    if (settings.newsApi.sourceType === 'rss') {
      return await this.fetchRSSNews();
    } else {
      return await this.fetchNewsAPINews();
    }
  }

  async fetchRSSNews() {
    const settings = dataStore.getSettings();

    try {
      const allArticles = [];
      const sources = settings.newsApi.sources || ['reuters', 'techcrunch', 'bbc'];

      console.log(`Fetching RSS feeds from: ${sources.join(', ')}`);

      // Fetch from each RSS feed
      for (const source of sources) {
        const feedUrl = this.rssFeeds[source];
        if (!feedUrl) {
          console.warn(`No RSS feed configured for source: ${source}`);
          continue;
        }

        try {
          const feed = await this.rssParser.parseURL(feedUrl);

          // Convert RSS items to our article format
          const articles = feed.items.slice(0, 10).map(item => ({
            title: item.title,
            description: item.contentSnippet || item.content || item.summary || '',
            url: item.link,
            source: { name: source },
            publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
            urlToImage: item.enclosure?.url || null,
            content: item.content || item.contentSnippet || ''
          }));

          allArticles.push(...articles);
        } catch (error) {
          console.error(`Error fetching RSS from ${source}:`, error.message);
        }
      }

      console.log(`Fetched ${allArticles.length} articles from RSS feeds`);

      // Filter by keywords if specified (and not empty)
      const keywords = (settings.newsApi.keywords || []).filter(k => k.trim().length > 0);
      let filteredArticles = allArticles;

      if (keywords.length > 0) {
        filteredArticles = allArticles.filter(article => {
          const text = `${article.title} ${article.description}`.toLowerCase();
          return keywords.some(keyword => text.includes(keyword.toLowerCase()));
        });
        console.log(`Filtered to ${filteredArticles.length} articles matching keywords: ${keywords.join(', ')}`);
      } else {
        console.log('No keywords specified - returning all articles');
      }

      const newArticles = await this.saveArticles(filteredArticles);
      console.log(`${newArticles.length} new articles added`);

      // Trigger matching for new articles
      if (newArticles.length > 0) {
        const matchingService = require('./matchingService');
        for (const article of newArticles) {
          await matchingService.processNewsArticle(article);
        }
      }

      return newArticles;
    } catch (error) {
      console.error('Error fetching RSS news:', error.message);
      return [];
    }
  }

  async fetchNewsAPINews() {
    const settings = dataStore.getSettings();

    if (!settings.newsApi.apiKey) {
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
          id: crypto.randomUUID(),
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
