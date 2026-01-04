const crypto = require('crypto');
const dataStore = require('./dataStore');
const limitService = require('./limitService');
const polymarketService = require('./polymarketService');

class TradeService {
  async executeTrade(newsArticle, market, aiDecision) {
    try {
      // Skip if AI said to skip
      if (aiDecision.decision === 'skip') {
        console.log(`Skipping trade for market "${market.question}" - AI decision: skip`);
        return { status: 'skipped', reason: aiDecision.reasoning };
      }

      // Calculate trade amount based on confidence
      const amount = limitService.calculateTradeAmount(aiDecision.confidence);

      // Check if trade is allowed
      const limitCheck = await limitService.canExecuteTrade(amount, aiDecision.confidence);

      if (!limitCheck.allowed) {
        console.log(`Trade queued: ${limitCheck.reason}`);
        await this.addToQueue(newsArticle, market, aiDecision, amount, limitCheck.reason);
        return {
          status: 'queued',
          reason: limitCheck.reason
        };
      }

      // Execute auto-trade
      console.log(`Auto-executing trade: ${aiDecision.decision.toUpperCase()} on "${market.question}" with $${amount} (${aiDecision.confidence}% confidence)`);

      const result = await polymarketService.placeBet(
        market.id,
        aiDecision.decision,
        amount
      );

      // Log trade
      const trade = {
        id: crypto.randomUUID(),
        newsId: newsArticle.id,
        newsTitle: newsArticle.title,
        marketId: market.id,
        marketQuestion: market.question,
        decision: aiDecision.decision,
        amount,
        confidence: aiDecision.confidence,
        reasoning: aiDecision.reasoning,
        status: 'executed',
        executionType: 'auto',
        polymarketTxHash: result.txHash,
        entryPrice: result.entryPrice,
        expectedReturn: amount / (result.entryPrice || 0.5),
        executedAt: new Date().toISOString(),
        testMode: result.testMode || false
      };

      dataStore.saveTrade(trade);
      await limitService.recordTrade(amount);

      console.log(`Trade executed successfully: ${trade.id}`);

      return {
        status: 'executed',
        trade,
        result
      };

    } catch (error) {
      console.error('Error executing trade:', error.message);

      // Queue for manual review if execution fails
      await this.addToQueue(
        newsArticle,
        market,
        aiDecision,
        limitService.calculateTradeAmount(aiDecision.confidence),
        `Execution failed: ${error.message}`
      );

      return {
        status: 'queued',
        reason: `Execution failed: ${error.message}`
      };
    }
  }

  async addToQueue(newsArticle, market, aiDecision, amount, reason) {
    const queuedTrade = {
      id: crypto.randomUUID(),
      newsArticle: {
        id: newsArticle.id,
        title: newsArticle.title,
        url: newsArticle.url,
        source: newsArticle.source,
        publishedAt: newsArticle.publishedAt
      },
      market: {
        id: market.id,
        question: market.question,
        currentOdds: market.currentOdds,
        endDate: market.endDate
      },
      aiDecision: {
        decision: aiDecision.decision,
        confidence: aiDecision.confidence,
        reasoning: aiDecision.reasoning
      },
      suggestedAmount: amount,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      reason
    };

    dataStore.addToQueue(queuedTrade);
    console.log(`Trade added to queue: ${queuedTrade.id} - ${reason}`);

    return queuedTrade;
  }

  async approveQueuedTrade(queueId, approvedAmount) {
    const queuedTrade = dataStore.getQueuedTradeById(queueId);

    if (!queuedTrade) {
      throw new Error('Queued trade not found');
    }

    try {
      // Execute the trade
      const result = await polymarketService.placeBet(
        queuedTrade.market.id,
        queuedTrade.aiDecision.decision,
        approvedAmount
      );

      // Log as manually approved trade
      const trade = {
        id: crypto.randomUUID(),
        newsId: queuedTrade.newsArticle.id,
        newsTitle: queuedTrade.newsArticle.title,
        marketId: queuedTrade.market.id,
        marketQuestion: queuedTrade.market.question,
        decision: queuedTrade.aiDecision.decision,
        amount: approvedAmount,
        confidence: queuedTrade.aiDecision.confidence,
        reasoning: queuedTrade.aiDecision.reasoning,
        status: 'executed',
        executionType: 'manual',
        polymarketTxHash: result.txHash,
        entryPrice: result.entryPrice,
        expectedReturn: approvedAmount / (result.entryPrice || 0.5),
        executedAt: new Date().toISOString(),
        queuedTradeId: queueId,
        testMode: result.testMode || false
      };

      dataStore.saveTrade(trade);
      dataStore.removeFromQueue(queueId);

      console.log(`Queued trade approved and executed: ${queueId}`);

      return {
        success: true,
        trade,
        result
      };

    } catch (error) {
      console.error('Error executing approved trade:', error.message);
      throw error;
    }
  }

  async rejectQueuedTrade(queueId, reason) {
    const queuedTrade = dataStore.getQueuedTradeById(queueId);

    if (!queuedTrade) {
      throw new Error('Queued trade not found');
    }

    // Log as rejected trade
    const trade = {
      id: crypto.randomUUID(),
      newsId: queuedTrade.newsArticle.id,
      newsTitle: queuedTrade.newsArticle.title,
      marketId: queuedTrade.market.id,
      marketQuestion: queuedTrade.market.question,
      decision: queuedTrade.aiDecision.decision,
      amount: 0,
      confidence: queuedTrade.aiDecision.confidence,
      reasoning: queuedTrade.aiDecision.reasoning,
      status: 'rejected',
      executionType: 'manual',
      rejectionReason: reason,
      executedAt: new Date().toISOString(),
      queuedTradeId: queueId
    };

    dataStore.saveTrade(trade);
    dataStore.removeFromQueue(queueId);

    console.log(`Queued trade rejected: ${queueId} - ${reason}`);

    return {
      success: true,
      trade
    };
  }

  async getQueuedTrades() {
    return dataStore.getQueuedTrades();
  }

  async getTradeHistory(filters = {}) {
    return dataStore.getTrades(filters);
  }

  async getTradeStats(days = 30) {
    return dataStore.getTradeStats(days);
  }
}

module.exports = new TradeService();
