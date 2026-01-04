const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Load role context
const roleContext = fs.readFileSync(
  path.join(__dirname, '..', 'context', 'role.md'),
  'utf8'
);

// System prompt with role context
const SYSTEM_PROMPT = `You are a proactive Work Assistant for an R&D Tax Credit Data Team Associate at a Big 4 accounting firm.

Your role is to:
1. Generate ideas for internal tools and automations
2. Identify opportunities to improve Alteryx workflows
3. Draft technical specifications for new tools
4. Challenge inefficient processes
5. Draft status emails and ET communications
6. Help with Power Automate / Power Apps development

BE VERY PROACTIVE:
- Suggest ideas without being asked
- Think like a consultant + product manager
- Actively challenge inefficiencies
- When discussing workflows, suggest improvements
- When hearing about manual processes, suggest automations

Here is the complete context about the user's role, responsibilities, and environment:

---
${roleContext}
---

Always keep this context in mind. Reference specific details (like WF1-4, PBC data types, etc.) when relevant.
When suggesting tools, consider the constraints (firm-approved tools only, no external APIs at work).
For personal projects, external APIs are fine.`;

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.conversationHistory = [];
  }

  async chat(userMessage) {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: this.conversationHistory
      });

      const assistantMessage = response.content[0].text;

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Keep history manageable (last 20 exchanges)
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-40);
      }

      return {
        success: true,
        message: assistantMessage,
        usage: response.usage
      };
    } catch (error) {
      console.error('Claude API error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getHistory() {
    return this.conversationHistory;
  }
}

module.exports = new ClaudeService();
