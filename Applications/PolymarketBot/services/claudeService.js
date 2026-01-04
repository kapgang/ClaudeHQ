const Anthropic = require('@anthropic-ai/sdk');
const dataStore = require('./dataStore');

class ClaudeService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  initializeClient() {
    const settings = dataStore.getSettings();
    if (settings.claude.apiKey && settings.claude.enabled) {
      this.client = new Anthropic({
        apiKey: settings.claude.apiKey
      });
    }
  }

  async analyzeNewsMarketMatch(newsArticle, market) {
    const settings = dataStore.getSettings();

    if (!this.client || !settings.claude.enabled) {
      throw new Error('Claude API is not configured or enabled');
    }

    const prompt = this.buildDecisionPrompt(newsArticle, market);

    try {
      const response = await this.client.messages.create({
        model: settings.claude.model,
        max_tokens: settings.claude.maxTokens,
        temperature: settings.claude.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      const decision = this.parseDecisionResponse(content);

      console.log(`Claude decision for "${newsArticle.title}" → "${market.question}": ${decision.decision} (${decision.confidence}%)`);

      return decision;
    } catch (error) {
      console.error('Error calling Claude API:', error.message);
      throw error;
    }
  }

  buildDecisionPrompt(newsArticle, market) {
    return `You are a prediction market analyst. Analyze this news article and determine if it provides actionable insight for the given market.

NEWS ARTICLE:
Title: ${newsArticle.title}
Source: ${newsArticle.source?.name || 'Unknown'}
Published: ${newsArticle.publishedAt}
Content: ${newsArticle.description || newsArticle.content || ''}

POLYMARKET MARKET:
Question: ${market.question}
${market.outcomes ? `Outcome Options: ${market.outcomes.join(', ')}` : ''}
${market.currentOdds ? `Current Odds: ${JSON.stringify(market.currentOdds)}` : ''}
${market.volume ? `Volume: $${market.volume}` : ''}
${market.endDate ? `Ends: ${market.endDate}` : ''}

TASK:
1. Determine if the news is relevant to this market
2. If relevant, decide: Should we bet YES or NO?
3. Provide confidence level (0-100)
4. Explain your reasoning in 2-3 sentences

Respond in JSON format:
{
  "decision": "yes" | "no" | "skip",
  "confidence": 0-100,
  "reasoning": "Brief explanation"
}

IMPORTANT:
- Only bet if confidence > 70
- Skip if news is not clearly relevant
- Consider market timing and current odds
- Avoid betting on already-obvious outcomes
- If the news is old or the market timing doesn't align, skip`;
  }

  parseDecisionResponse(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const decision = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!decision.decision || typeof decision.confidence !== 'number') {
        throw new Error('Invalid decision structure');
      }

      // Normalize decision value
      decision.decision = decision.decision.toLowerCase();
      if (!['yes', 'no', 'skip'].includes(decision.decision)) {
        decision.decision = 'skip';
      }

      // Ensure confidence is in valid range
      decision.confidence = Math.min(100, Math.max(0, decision.confidence));

      // Ensure reasoning exists
      if (!decision.reasoning) {
        decision.reasoning = 'No reasoning provided';
      }

      return decision;
    } catch (error) {
      console.error('Error parsing Claude response:', error.message);
      console.error('Raw content:', content);

      // Return safe default
      return {
        decision: 'skip',
        confidence: 0,
        reasoning: 'Failed to parse AI response'
      };
    }
  }

  async batchAnalyze(newsArticle, markets) {
    const results = [];

    for (const market of markets) {
      try {
        const decision = await this.analyzeNewsMarketMatch(newsArticle, market);
        results.push({
          market,
          decision
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error analyzing market ${market.id}:`, error.message);
        results.push({
          market,
          decision: {
            decision: 'skip',
            confidence: 0,
            reasoning: `Analysis failed: ${error.message}`
          }
        });
      }
    }

    return results;
  }
}

module.exports = new ClaudeService();
