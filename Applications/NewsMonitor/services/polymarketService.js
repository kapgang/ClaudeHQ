const axios = require('axios');
const dataStore = require('./dataStore');

class PolymarketService {
  constructor() {
    this.client = null;
  }

  getSettings() {
    const settings = dataStore.getSettings();
    return settings.polymarket;
  }

  isEnabled() {
    const config = this.getSettings();
    return config.enabled && config.apiKey;
  }

  async searchMarkets(keywords) {
    if (!this.isEnabled()) {
      throw new Error('Polymarket is not enabled or configured');
    }

    const config = this.getSettings();

    try {
      // Convert keywords array to search query
      const query = Array.isArray(keywords) ? keywords.join(' ') : keywords;

      console.log(`Searching Polymarket for: ${query}`);

      // Polymarket API endpoint for searching markets
      const response = await axios.get(`${config.endpoint}/markets`, {
        params: {
          q: query,
          active: true,
          limit: 10
        },
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      let markets = response.data || [];
      if (Array.isArray(response.data.markets)) {
        markets = response.data.markets;
      }

      // Filter and process markets
      const filteredMarkets = markets
        .filter(m => {
          // Only active markets
          if (m.closed || m.resolved) return false;

          // Minimum liquidity check (if available)
          if (m.liquidity && m.liquidity < 100) return false;

          // Check end date (must be at least 7 days away)
          if (m.endDate || m.end_date) {
            const endDate = new Date(m.endDate || m.end_date);
            const daysUntilEnd = (endDate - new Date()) / (1000 * 60 * 60 * 24);
            if (daysUntilEnd < 7) return false;
          }

          return true;
        })
        .slice(0, 3) // Top 3 most relevant
        .map(m => this.normalizeMarket(m));

      console.log(`Found ${filteredMarkets.length} relevant markets`);
      return filteredMarkets;

    } catch (error) {
      console.error('Error searching Polymarket:', error.message);

      // Return mock data in test mode for development
      if (config.testMode) {
        console.log('Test mode: returning mock market data');
        return this.getMockMarkets(keywords);
      }

      throw error;
    }
  }

  normalizeMarket(market) {
    return {
      id: market.id || market.market_id,
      question: market.question || market.title,
      outcomes: market.outcomes || ['Yes', 'No'],
      currentOdds: market.odds || market.prices || { yes: 0.5, no: 0.5 },
      volume: market.volume || 0,
      liquidity: market.liquidity || 0,
      endDate: market.endDate || market.end_date,
      active: !market.closed && !market.resolved,
      description: market.description || ''
    };
  }

  async getMarketDetails(marketId) {
    if (!this.isEnabled()) {
      throw new Error('Polymarket is not enabled or configured');
    }

    const config = this.getSettings();

    try {
      const response = await axios.get(`${config.endpoint}/markets/${marketId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 10000
      });

      return this.normalizeMarket(response.data);
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error.message);

      if (config.testMode) {
        return this.getMockMarkets()[0];
      }

      throw error;
    }
  }

  async placeBet(marketId, outcome, amount) {
    if (!this.isEnabled()) {
      throw new Error('Polymarket is not enabled or configured');
    }

    const config = this.getSettings();

    // In test mode, simulate successful trade
    if (config.testMode) {
      console.log(`TEST MODE: Simulated bet - Market: ${marketId}, Outcome: ${outcome}, Amount: $${amount}`);
      return {
        success: true,
        txHash: 'test_' + Date.now(),
        marketId,
        outcome,
        amount,
        entryPrice: outcome === 'yes' ? 0.65 : 0.35,
        testMode: true
      };
    }

    try {
      // Real Polymarket trading would go here
      // This requires:
      // 1. Signing the transaction with private key
      // 2. Submitting to CLOB API
      // 3. Waiting for confirmation

      const response = await axios.post(
        `${config.clobEndpoint}/order`,
        {
          market_id: marketId,
          outcome,
          amount,
          side: 'buy'
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return {
        success: true,
        txHash: response.data.tx_hash || response.data.id,
        marketId,
        outcome,
        amount,
        entryPrice: response.data.price || 0.5
      };
    } catch (error) {
      console.error('Error placing bet:', error.message);
      throw error;
    }
  }

  async getPositions() {
    if (!this.isEnabled()) {
      throw new Error('Polymarket is not enabled or configured');
    }

    const config = this.getSettings();

    if (config.testMode) {
      return [];
    }

    try {
      const response = await axios.get(`${config.endpoint}/positions`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        params: {
          wallet: config.walletAddress
        },
        timeout: 10000
      });

      return response.data.positions || [];
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      return [];
    }
  }

  async getBalance() {
    if (!this.isEnabled()) {
      return 0;
    }

    const config = this.getSettings();

    if (config.testMode) {
      return 1000; // $1000 test balance
    }

    try {
      const response = await axios.get(`${config.endpoint}/balance`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        params: {
          wallet: config.walletAddress
        },
        timeout: 10000
      });

      return response.data.balance || 0;
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      return 0;
    }
  }

  // Mock data for testing/development
  getMockMarkets(keywords) {
    const keywordStr = Array.isArray(keywords) ? keywords.join(' ').toLowerCase() : keywords.toLowerCase();

    const mockMarkets = [
      {
        id: 'mock_election_1',
        question: 'Will there be a major policy announcement this week?',
        outcomes: ['Yes', 'No'],
        currentOdds: { yes: 0.45, no: 0.55 },
        volume: 15000,
        liquidity: 5000,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        description: 'Market on upcoming policy announcements'
      },
      {
        id: 'mock_tech_1',
        question: 'Will major tech company announce new AI product this quarter?',
        outcomes: ['Yes', 'No'],
        currentOdds: { yes: 0.65, no: 0.35 },
        volume: 25000,
        liquidity: 8000,
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        description: 'Technology sector predictions'
      },
      {
        id: 'mock_sports_1',
        question: 'Will the championship game exceed viewership records?',
        outcomes: ['Yes', 'No'],
        currentOdds: { yes: 0.52, no: 0.48 },
        volume: 50000,
        liquidity: 12000,
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        description: 'Sports event predictions'
      }
    ];

    // Filter mock markets by keyword relevance
    return mockMarkets.filter(m => {
      const marketText = (m.question + ' ' + m.description).toLowerCase();
      return keywordStr.split(' ').some(keyword => marketText.includes(keyword));
    }).slice(0, 3);
  }
}

module.exports = new PolymarketService();
