const crypto = require('crypto');
const dataStore = require('./dataStore');
const polymarketService = require('./polymarketService');
const claudeService = require('./claudeService');
const tradeService = require('./tradeService');

class MatchingService {
  async processNewsArticle(article) {
    try {
      console.log(`\n=== Processing news article: "${article.title}" ===`);

      // Mark article as being processed
      dataStore.updateNewsArticle(article.id, {
        matchStatus: 'processing',
        processedAt: new Date().toISOString()
      });

      // 1. Extract keywords from article
      const keywords = this.extractKeywords(article);
      console.log(`Keywords: ${keywords.join(', ')}`);

      // 2. Search Polymarket for matching markets
      const markets = await polymarketService.searchMarkets(keywords);

      if (markets.length === 0) {
        console.log('No matching markets found');

        // Update article status - no markets found
        dataStore.updateNewsArticle(article.id, {
          matchStatus: 'no-match',
          matchedMarkets: 0,
          processedAt: new Date().toISOString()
        });

        return {
          article,
          matches: [],
          trades: []
        };
      }

      console.log(`Found ${markets.length} potential markets`);

      // 3. Analyze each market with Claude
      const matches = [];
      const trades = [];

      for (const market of markets) {
        try {
          console.log(`\nAnalyzing market: "${market.question}"`);

          const decision = await claudeService.analyzeNewsMarketMatch(article, market);

          // 4. Save match
          const match = {
            id: crypto.randomUUID(),
            newsId: article.id,
            newsTitle: article.title,
            marketId: market.id,
            marketQuestion: market.question,
            marketUrl: market.url,
            currentOdds: market.currentOdds,
            matchedKeywords: keywords.filter(kw => kw && kw.trim().length > 0),
            aiDecision: decision,
            status: decision.decision === 'skip' ? 'skipped' : 'pending_execution',
            createdAt: new Date().toISOString()
          };

          dataStore.saveMatch(match);
          matches.push(match);

          // 5. Execute or queue trade (if not skipped)
          if (decision.decision !== 'skip') {
            const tradeResult = await tradeService.executeTrade(article, market, decision);
            trades.push(tradeResult);
          }

          // Small delay between API calls to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Error processing market ${market.id}:`, error.message);
        }
      }

      console.log(`\n=== Completed processing: ${matches.length} matches, ${trades.length} trade actions ===\n`);

      // Update article status - matched
      dataStore.updateNewsArticle(article.id, {
        matchStatus: matches.length > 0 ? 'matched' : 'no-match',
        matchedMarkets: matches.length,
        processedAt: new Date().toISOString()
      });

      return {
        article,
        matches,
        trades
      };

    } catch (error) {
      console.error(`Error in matchingService.processNewsArticle:`, error);

      // Update article status - error
      dataStore.updateNewsArticle(article.id, {
        matchStatus: 'error',
        matchedMarkets: 0,
        processedAt: new Date().toISOString()
      });

      throw error;
    }
  }

  extractKeywords(article) {
    // Simple keyword extraction from title and description
    const text = `${article.title} ${article.description || ''}`.toLowerCase();

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'about', 'after', 'before'
    ]);

    // Extract words (3+ chars, alphanumeric only)
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word =>
        word.length >= 3 &&
        !stopWords.has(word) &&
        /[a-z]/.test(word)
      );

    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and take top keywords
    const topKeywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Add original category keywords from settings if title matches
    const settings = dataStore.getSettings();
    const categoryKeywords = settings.newsApi.keywords || [];

    categoryKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (text.includes(keywordLower) && !topKeywords.includes(keywordLower)) {
        topKeywords.unshift(keywordLower);
      }
    });

    return topKeywords.slice(0, 5); // Return top 5 keywords
  }

  async getActiveMatches(limit = 50) {
    return dataStore.getMatches({ limit });
  }

  async rematchNewsArticle(newsId) {
    // Get the news article
    const newsService = require('./newsService');
    const article = await newsService.getNewsById(newsId);

    if (!article) {
      throw new Error('News article not found');
    }

    // Re-process the article
    return await this.processNewsArticle(article);
  }
}

module.exports = new MatchingService();
