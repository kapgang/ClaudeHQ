const dataStore = require('./dataStore');

class LimitService {
  constructor() {
    this.dailySpent = 0;
    this.dailyTradeCount = 0;
    this.lastResetDate = new Date().toDateString();
    this.loadTodayStats();
  }

  loadTodayStats() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailySpent = 0;
      this.dailyTradeCount = 0;
      this.lastResetDate = today;
    } else {
      // Load today's trades from dataStore
      const trades = dataStore.getTrades({ days: 1 });
      const todayTrades = trades.filter(t => {
        const tradeDate = new Date(t.executedAt || t.createdAt).toDateString();
        return tradeDate === today && (t.status === 'executed' || t.executionType === 'auto');
      });

      this.dailySpent = todayTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
      this.dailyTradeCount = todayTrades.length;
    }
  }

  async checkDailyLimits() {
    await this.resetLimitsIfNeeded();

    const settings = dataStore.getSettings();
    const limits = settings.tradingLimits;

    const canTrade =
      this.dailySpent < limits.dailyMaxUSD &&
      this.dailyTradeCount < limits.dailyMaxTrades;

    return {
      canTrade,
      remainingUSD: Math.max(0, limits.dailyMaxUSD - this.dailySpent),
      remainingTrades: Math.max(0, limits.dailyMaxTrades - this.dailyTradeCount),
      spentToday: this.dailySpent,
      tradesToday: this.dailyTradeCount,
      limits
    };
  }

  async resetLimitsIfNeeded() {
    const settings = dataStore.getSettings();
    const resetHour = settings.tradingLimits.resetHour || 0;

    const now = new Date();
    const today = now.toDateString();
    const currentHour = now.getUTCHours();

    // Check if we've passed the reset hour and it's a new day
    if (this.lastResetDate !== today) {
      if (currentHour >= resetHour) {
        console.log('Daily limits reset');
        this.dailySpent = 0;
        this.dailyTradeCount = 0;
        this.lastResetDate = today;
      }
    }
  }

  async recordTrade(amount) {
    this.dailySpent += amount;
    this.dailyTradeCount += 1;
    console.log(`Recorded trade: $${amount}. Today: $${this.dailySpent}, ${this.dailyTradeCount} trades`);
  }

  async canExecuteTrade(amount, confidence) {
    const limits = await this.checkDailyLimits();
    const settings = dataStore.getSettings();

    // Check confidence threshold
    if (confidence < settings.tradingLimits.minConfidence) {
      return {
        allowed: false,
        reason: `Confidence ${confidence}% below minimum ${settings.tradingLimits.minConfidence}%`
      };
    }

    // Check per-trade limit
    if (amount > settings.tradingLimits.maxPerTrade) {
      return {
        allowed: false,
        reason: `Amount $${amount} exceeds max per trade $${settings.tradingLimits.maxPerTrade}`
      };
    }

    // Check daily limits
    if (!limits.canTrade) {
      if (limits.remainingUSD <= 0) {
        return {
          allowed: false,
          reason: `Daily USD limit reached ($${settings.tradingLimits.dailyMaxUSD})`
        };
      }
      if (limits.remainingTrades <= 0) {
        return {
          allowed: false,
          reason: `Daily trade count limit reached (${settings.tradingLimits.dailyMaxTrades})`
        };
      }
    }

    // Check if amount exceeds remaining daily limit
    if (amount > limits.remainingUSD) {
      return {
        allowed: false,
        reason: `Amount $${amount} exceeds remaining daily limit $${limits.remainingUSD.toFixed(2)}`
      };
    }

    return {
      allowed: true,
      limits
    };
  }

  calculateTradeAmount(confidence) {
    const settings = dataStore.getSettings();
    const maxAmount = settings.tradingLimits.maxPerTrade;

    // Scale amount by confidence
    if (confidence >= 90) return maxAmount;
    if (confidence >= 80) return Math.floor(maxAmount * 0.7);
    if (confidence >= 70) return Math.floor(maxAmount * 0.5);

    return Math.floor(maxAmount * 0.3);
  }

  getDailyStats() {
    return {
      spent: this.dailySpent,
      tradeCount: this.dailyTradeCount,
      lastReset: this.lastResetDate
    };
  }
}

module.exports = new LimitService();
