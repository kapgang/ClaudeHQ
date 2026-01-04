// Global state
let currentTab = 'queue';
let updateInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateAll();

  // Start auto-refresh every 30 seconds
  updateInterval = setInterval(updateAll, 30000);
});

// Main update function
async function updateAll() {
  await Promise.all([
    updateNews(),
    updateMatches(),
    updateQueue(),
    updateStats()
  ]);
}

// Fetch and render news
async function updateNews() {
  try {
    const response = await fetch('/api/news/recent?hours=24&limit=20');
    const data = await response.json();

    if (data.success) {
      renderNews(data.articles);
      document.getElementById('news-status').textContent =
        `News: ${data.count} articles`;
      document.getElementById('news-status').style.color = '#10b981';
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    document.getElementById('news-list').innerHTML =
      '<div class="empty">Error loading news</div>';
  }
}

function renderNews(articles) {
  const container = document.getElementById('news-list');

  if (!articles || articles.length === 0) {
    container.innerHTML = '<div class="empty">No recent news</div>';
    return;
  }

  container.innerHTML = articles.map(article => `
    <div class="news-card">
      <div class="title">${escapeHtml(article.title)}</div>
      <div class="meta">
        ${article.source} • ${timeAgo(article.publishedAt)}
      </div>
      ${article.matchedMarkets > 0 ? `
        <span class="matches-count">${article.matchedMarkets} markets matched</span>
      ` : ''}
    </div>
  `).join('');
}

// Fetch and render matches
async function updateMatches() {
  try {
    const response = await fetch('/api/markets/active?limit=20');
    const data = await response.json();

    if (data.success) {
      renderMatches(data.matches);
    }
  } catch (error) {
    console.error('Error fetching matches:', error);
    document.getElementById('matches-list').innerHTML =
      '<div class="empty">Error loading matches</div>';
  }
}

function renderMatches(matches) {
  const container = document.getElementById('matches-list');

  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="empty">No active matches</div>';
    return;
  }

  container.innerHTML = matches.map(match => `
    <div class="match-card">
      <div class="news-title">${escapeHtml(match.newsTitle || 'News article')}</div>
      <div class="market-question">${escapeHtml(match.marketQuestion)}</div>

      <div class="ai-decision">
        <span class="decision-badge ${match.aiDecision.decision}">
          ${match.aiDecision.decision.toUpperCase()}
        </span>
        <span class="confidence">${match.aiDecision.confidence}% confidence</span>
        <div class="reasoning">${escapeHtml(match.aiDecision.reasoning)}</div>
      </div>

      ${match.status === 'executed' || match.status === 'queued' ? `
        <div class="execution-status ${match.status}">
          ${match.status === 'executed' ? '⚡ AUTO-EXECUTED' : '⏳ QUEUED FOR APPROVAL'}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Fetch and render trade queue
async function updateQueue() {
  try {
    const response = await fetch('/api/trades/queue');
    const data = await response.json();

    if (data.success) {
      document.getElementById('queue-count').textContent = data.count;
      renderQueue(data.queue);
    }
  } catch (error) {
    console.error('Error fetching queue:', error);
    document.getElementById('queue-list').innerHTML =
      '<div class="empty">Error loading queue</div>';
  }
}

function renderQueue(queue) {
  const container = document.getElementById('queue-list');

  if (!queue || queue.length === 0) {
    container.innerHTML = '<div class="empty">No pending trades</div>';
    return;
  }

  container.innerHTML = queue.map(trade => `
    <div class="trade-card pending">
      <div class="queue-header">
        <span class="pending-badge">⏳ AWAITING APPROVAL</span>
        <span style="color: var(--text-dim)">${timeAgo(trade.createdAt)}</span>
      </div>

      <div><strong>News:</strong> ${escapeHtml(trade.newsArticle.title)}</div>
      <div style="margin-top: 0.5rem"><strong>Market:</strong> ${escapeHtml(trade.market.question)}</div>

      <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-tertiary); border-radius: 4px;">
        <div><strong>AI Suggests:</strong> BET ${trade.aiDecision.decision.toUpperCase()} (${trade.aiDecision.confidence}%)</div>
        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary)">
          ${escapeHtml(trade.aiDecision.reasoning)}
        </div>
      </div>

      <div style="margin-top: 0.75rem">
        <strong>Suggested Amount:</strong> $${trade.suggestedAmount}
      </div>
      <div style="color: var(--text-dim); font-size: 0.85rem">
        Reason: ${escapeHtml(trade.reason)}
      </div>

      <div class="trade-actions">
        <button class="btn-approve" onclick="approveTrade('${trade.id}', ${trade.suggestedAmount})">
          ✓ Approve $${trade.suggestedAmount}
        </button>
        <button class="btn-reject" onclick="rejectTrade('${trade.id}')">
          ✗ Reject
        </button>
      </div>
    </div>
  `).join('');
}

// Approve trade
async function approveTrade(tradeId, amount) {
  if (!confirm(`Approve trade for $${amount}?`)) return;

  try {
    const response = await fetch(`/api/trades/approve/${tradeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();

    if (data.success) {
      alert('Trade approved and executed!');
      await updateAll();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error approving trade: ' + error.message);
  }
}

// Reject trade
async function rejectTrade(tradeId) {
  const reason = prompt('Reason for rejection (optional):') || 'Manually rejected';

  try {
    const response = await fetch(`/api/trades/reject/${tradeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    const data = await response.json();

    if (data.success) {
      alert('Trade rejected');
      await updateAll();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error rejecting trade: ' + error.message);
  }
}

// Update stats
async function updateStats() {
  try {
    const response = await fetch('/api/trades/stats');
    const data = await response.json();

    if (data.success) {
      renderStats(data);

      // Update header status
      const limitsText = `$${data.daily.spent.toFixed(0)}/$${data.limits.limits.dailyMaxUSD} Daily`;
      document.getElementById('limits-status').textContent = limitsText;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

function renderStats(data) {
  const container = document.getElementById('stats-container');

  container.innerHTML = `
    <h3 style="margin-bottom: 1rem">Daily Stats</h3>
    <div class="stat-row">
      <span class="stat-label">Spent Today</span>
      <span class="stat-value">$${data.daily.spent.toFixed(2)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Trades Today</span>
      <span class="stat-value">${data.daily.tradeCount}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Remaining USD</span>
      <span class="stat-value">$${data.limits.remainingUSD.toFixed(2)}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Remaining Trades</span>
      <span class="stat-value">${data.limits.remainingTrades}</span>
    </div>

    <h3 style="margin: 1.5rem 0 1rem">All Time Stats</h3>
    <div class="stat-row">
      <span class="stat-label">Total Trades</span>
      <span class="stat-value">${data.stats.total}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Executed</span>
      <span class="stat-value">${data.stats.executed}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Rejected</span>
      <span class="stat-value">${data.stats.rejected}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Avg Confidence</span>
      <span class="stat-value">${data.stats.avgConfidence.toFixed(1)}%</span>
    </div>
  `;
}

// Tab switching
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Update tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  document.getElementById(`${tab}-panel`).classList.add('active');

  // Load data for tab if needed
  if (tab === 'history') {
    updateHistory();
  }
}

// Update history
async function updateHistory() {
  try {
    const response = await fetch('/api/trades/history?days=7&limit=50');
    const data = await response.json();

    if (data.success) {
      renderHistory(data.trades);
    }
  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

function renderHistory(trades) {
  const container = document.getElementById('history-list');

  if (!trades || trades.length === 0) {
    container.innerHTML = '<div class="empty">No trade history</div>';
    return;
  }

  container.innerHTML = trades.map(trade => `
    <div class="trade-card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem">
        <strong>${trade.decision.toUpperCase()} - $${trade.amount}</strong>
        <span style="color: var(--text-dim)">${timeAgo(trade.executedAt)}</span>
      </div>
      <div style="font-size: 0.9rem; color: var(--text-secondary)">
        ${escapeHtml(trade.marketQuestion)}
      </div>
      <div style="margin-top: 0.5rem; font-size: 0.85rem">
        <span class="decision-badge ${trade.status}">${trade.status.toUpperCase()}</span>
        ${trade.executionType === 'auto' ? '<span style="color: var(--success)">⚡ Auto</span>' : '<span style="color: var(--warning)">👤 Manual</span>'}
        ${trade.testMode ? '<span style="color: var(--text-dim)">(Test Mode)</span>' : ''}
      </div>
    </div>
  `).join('');
}

// Settings
function toggleSettings() {
  document.querySelector('.settings-content').classList.toggle('open');
}

async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();

    if (data.success) {
      const s = data.settings;

      // NewsAPI
      document.getElementById('newsapi-key').value = s.newsApi.apiKey || '';
      document.getElementById('newsapi-sources').value = s.newsApi.sources.join(',');
      document.getElementById('newsapi-keywords').value = s.newsApi.keywords.join(',');
      document.getElementById('newsapi-enabled').checked = s.newsApi.enabled;

      // Polymarket
      document.getElementById('polymarket-key').value = s.polymarket.apiKey || '';
      document.getElementById('polymarket-testmode').checked = s.polymarket.testMode;
      document.getElementById('polymarket-enabled').checked = s.polymarket.enabled;

      // Claude
      document.getElementById('claude-key').value = s.claude.apiKey || '';
      document.getElementById('claude-threshold').value = s.claude.confidenceThreshold;
      document.getElementById('claude-enabled').checked = s.claude.enabled;

      // Limits
      document.getElementById('limits-daily-usd').value = s.tradingLimits.dailyMaxUSD;
      document.getElementById('limits-daily-trades').value = s.tradingLimits.dailyMaxTrades;
      document.getElementById('limits-per-trade').value = s.tradingLimits.maxPerTrade;
      document.getElementById('limits-min-confidence').value = s.tradingLimits.minConfidence;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function saveSettings() {
  const updates = [
    {
      endpoint: '/api/settings/news',
      data: {
        apiKey: document.getElementById('newsapi-key').value,
        sources: document.getElementById('newsapi-sources').value.split(',').map(s => s.trim()),
        keywords: document.getElementById('newsapi-keywords').value.split(',').map(s => s.trim()),
        enabled: document.getElementById('newsapi-enabled').checked
      }
    },
    {
      endpoint: '/api/settings/polymarket',
      data: {
        apiKey: document.getElementById('polymarket-key').value,
        testMode: document.getElementById('polymarket-testmode').checked,
        enabled: document.getElementById('polymarket-enabled').checked
      }
    },
    {
      endpoint: '/api/settings/claude',
      data: {
        apiKey: document.getElementById('claude-key').value,
        confidenceThreshold: parseInt(document.getElementById('claude-threshold').value),
        enabled: document.getElementById('claude-enabled').checked
      }
    },
    {
      endpoint: '/api/settings/limits',
      data: {
        dailyMaxUSD: parseInt(document.getElementById('limits-daily-usd').value),
        dailyMaxTrades: parseInt(document.getElementById('limits-daily-trades').value),
        maxPerTrade: parseInt(document.getElementById('limits-per-trade').value),
        minConfidence: parseInt(document.getElementById('limits-min-confidence').value)
      }
    }
  ];

  try {
    for (const update of updates) {
      await fetch(update.endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update.data)
      });
    }

    alert('Settings saved successfully!');
  } catch (error) {
    alert('Error saving settings: ' + error.message);
  }
}

async function testConnections() {
  try {
    const response = await fetch('/api/settings/test-connection', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      const results = data.results;
      alert(`Connection Test Results:\n\nNewsAPI: ${results.news}\nPolymarket: ${results.polymarket}\nClaude: ${results.claude}`);
    }
  } catch (error) {
    alert('Error testing connections: ' + error.message);
  }
}

// Manual refresh
async function refreshNews() {
  try {
    const response = await fetch('/api/news/refresh', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      alert(`Fetched ${data.count} new articles`);
      await updateAll();
    }
  } catch (error) {
    alert('Error refreshing news: ' + error.message);
  }
}

// Utilities
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
