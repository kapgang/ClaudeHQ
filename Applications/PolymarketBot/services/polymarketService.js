const dataStore = require('./dataStore');

class PolymarketService {
  constructor() {
    this.client = null;
    this.apiCreds = null;
    this.ClobClient = null;
    this.Wallet = null;
    this.initialized = false;
    this.marketCache = null;
    this.cacheExpiry = null;
    this.cacheLifetime = 5 * 60 * 1000;  // 5 minutes
  }

  async loadDependencies() {
    if (this.initialized) return;

    try {
      // Dynamic import for ES modules
      const clobModule = await import('@polymarket/clob-client');
      const ethersModule = await import('ethers');

      this.ClobClient = clobModule.ClobClient;
      this.Wallet = ethersModule.Wallet;
      this.initialized = true;
    } catch (error) {
      console.error('Error loading Polymarket dependencies:', error.message);
      throw error;
    }
  }

  getSettings() {
    const settings = dataStore.getSettings();
    return settings.polymarket;
  }

  getActiveWallet() {
    return dataStore.getActiveWallet();
  }

  isEnabled() {
    const config = this.getSettings();
    const activeWallet = this.getActiveWallet();
    return config.enabled && activeWallet && activeWallet.privateKey;
  }

  async initializeClient() {
    const config = this.getSettings();
    const activeWallet = this.getActiveWallet();

    if (!activeWallet || !activeWallet.privateKey || !config.enabled) {
      console.log('Polymarket not configured or disabled (no active wallet selected)');
      return false;
    }

    try {
      // Load dependencies first
      await this.loadDependencies();

      // Initialize CLOB client with active wallet's private key
      console.log(`Initializing Polymarket with wallet: ${activeWallet.name} (${activeWallet.address})`);
      const wallet = new this.Wallet(activeWallet.privateKey);

      this.client = new this.ClobClient(
        config.clobEndpoint || 'https://clob.polymarket.com',
        137, // Polygon mainnet chain ID
        wallet,
        undefined,  // creds
        undefined,  // signatureType
        undefined,  // funderAddress
        config.geoBlockToken || undefined  // geoBlockToken for US access if needed
      );

      // Create or derive API credentials
      console.log('Initializing Polymarket API credentials...');
      this.apiCreds = await this.client.createOrDeriveApiKey();
      console.log('Polymarket client initialized successfully');

      return true;
    } catch (error) {
      console.error('Error initializing Polymarket client:', error.message);
      this.client = null;
      this.apiCreds = null;
      return false;
    }
  }

  async ensureInitialized() {
    if (!this.client) {
      const initialized = await this.initializeClient();
      if (!initialized) {
        throw new Error('Polymarket client not initialized');
      }
    }
  }

  async getAllMarkets(forceRefresh = false) {
    // Check cache validity
    if (!forceRefresh && this.marketCache && this.cacheExpiry > Date.now()) {
      console.log(`Using cached markets (${this.marketCache.length} markets)`);
      return this.marketCache;
    }

    // Fetch fresh markets from CLOB API
    console.log('Fetching ALL markets from Polymarket CLOB API...');
    const markets = await this.client.getMarkets();

    // Cache the results
    this.marketCache = markets;
    this.cacheExpiry = Date.now() + this.cacheLifetime;

    console.log(`Cached ${markets.length} markets for 5 minutes`);
    return markets;
  }

  async searchMarkets(keywords) {
    const config = this.getSettings();

    // Return mock data in test mode
    if (config.testMode) {
      console.log('Test mode: returning mock market data');
      return this.getMockMarkets(keywords);
    }

    if (!this.isEnabled()) {
      throw new Error('Polymarket is not enabled or configured');
    }

    try {
      await this.ensureInitialized();

      // Fetch ALL markets (with caching)
      const allMarkets = await this.getAllMarkets();

      // Convert keywords to searchable terms
      const keywordArray = Array.isArray(keywords)
        ? keywords.filter(k => k && k.trim())
        : [keywords];

      console.log(`Filtering ${allMarkets.length} markets with keywords: ${keywordArray.join(', ')}`);

      // Filter and score markets
      const scoredMarkets = allMarkets
        .filter(m => {
          // Must be active
          if (m.closed || !m.active) return false;

          // Liquidity check: > $1000
          const liquidity = parseFloat(m.liquidity || 0);
          if (liquidity <= 1000) return false;

          // Must expire in at least 7 days
          if (m.end_date_iso) {
            const endDate = new Date(m.end_date_iso);
            const daysUntilEnd = (endDate - new Date()) / (1000 * 60 * 60 * 24);
            if (daysUntilEnd < 7) return false;
          }

          return true;
        })
        .map(m => {
          // Score based on keyword matches
          const marketText = (m.question + ' ' + (m.description || '')).toLowerCase();
          let score = 0;

          keywordArray.forEach(keyword => {
            if (marketText.includes(keyword.toLowerCase())) {
              score += 1;
              // Bonus if in question (not just description)
              if (m.question.toLowerCase().includes(keyword.toLowerCase())) {
                score += 2;
              }
            }
          });

          return { market: m, score };
        })
        .filter(item => item.score > 0)  // Only markets with at least 1 match
        .sort((a, b) => b.score - a.score)  // Sort by score descending
        .slice(0, 3)  // Top 3 matches
        .map(item => this.normalizeMarket(item.market));

      console.log(`Found ${scoredMarkets.length} relevant markets`);
      return scoredMarkets;

    } catch (error) {
      console.error('Error searching Polymarket:', error.message);

      // Fallback to mock data in test mode
      if (config.testMode) {
        console.log('Error occurred, falling back to mock data');
        return this.getMockMarkets(keywords);
      }

      throw error;
    }
  }

  normalizeMarket(market) {
    // Only generate real Polymarket URLs if we have a real slug from the API
    // Mock markets won't have valid URLs
    const url = market.slug ? `https://polymarket.com/event/${market.slug}` : null;

    return {
      id: market.condition_id || market.id,
      question: market.question,
      outcomes: market.outcomes || ['Yes', 'No'],
      currentOdds: this.parseOutcomePrices(market),
      volume: parseFloat(market.volume || 0),
      liquidity: parseFloat(market.liquidity || 0),
      endDate: market.end_date_iso || market.end_date,
      active: market.active && !market.closed,
      description: market.description || '',
      url: url
    };
  }

  parseOutcomePrices(market) {
    // Try to parse outcome prices from the market data
    if (market.outcome_prices) {
      const prices = market.outcome_prices.split(',').map(p => parseFloat(p));
      return {
        yes: prices[0] || 0.5,
        no: prices[1] || 0.5
      };
    }

    return { yes: 0.5, no: 0.5 };
  }

  async getMarketDetails(marketId) {
    const config = this.getSettings();

    if (config.testMode) {
      return this.getMockMarkets()[0];
    }

    try {
      await this.ensureInitialized();

      // Get market by ID using the SDK
      const market = await this.client.getMarket(marketId);
      return this.normalizeMarket(market);
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error.message);

      if (config.testMode) {
        return this.getMockMarkets()[0];
      }

      throw error;
    }
  }

  async placeBet(marketId, outcome, amount) {
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
      await this.ensureInitialized();

      console.log(`Placing real bet: ${outcome.toUpperCase()} on market ${marketId} for $${amount}`);

      // Determine the token ID based on outcome
      // Note: You'll need to get the correct token ID from the market details
      const market = await this.getMarketDetails(marketId);
      const outcomeIndex = outcome.toLowerCase() === 'yes' ? 0 : 1;

      // Create a limit order using the SDK
      // This is a simplified example - you may need to adjust based on actual market structure
      const order = await this.client.createOrder({
        tokenID: market.outcomes[outcomeIndex],
        price: outcome === 'yes' ? 0.65 : 0.35, // You'd typically get this from current market price
        size: amount,
        side: 'BUY'
      });

      return {
        success: true,
        txHash: order.orderID,
        marketId,
        outcome,
        amount,
        entryPrice: order.price || 0.5
      };
    } catch (error) {
      console.error('Error placing bet:', error.message);
      throw error;
    }
  }

  async getPositions() {
    const config = this.getSettings();

    if (config.testMode) {
      return [];
    }

    try {
      await this.ensureInitialized();

      // Get user's open positions
      const positions = await this.client.getOpenOrders();
      return positions || [];
    } catch (error) {
      console.error('Error fetching positions:', error.message);
      return [];
    }
  }

  async getBalance() {
    const config = this.getSettings();

    if (config.testMode) {
      return 1000; // $1000 test balance
    }

    try {
      await this.ensureInitialized();

      // Get wallet balance from the client
      const balance = await this.client.getBalance();
      return parseFloat(balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      return 0;
    }
  }

  // Mock data for testing/development
  getMockMarkets(keywords) {
    const keywordStr = Array.isArray(keywords) ? keywords.join(' ').toLowerCase() : (keywords || '').toLowerCase();

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
        // No URL for mock markets
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
        // No URL for mock markets
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
        // No URL for mock markets
      }
    ];

    // Filter mock markets by keyword relevance
    if (!keywordStr) return mockMarkets.slice(0, 3);

    return mockMarkets.filter(m => {
      const marketText = (m.question + ' ' + m.description).toLowerCase();
      return keywordStr.split(' ').some(keyword => marketText.includes(keyword));
    }).slice(0, 3);
  }
}

module.exports = new PolymarketService();
