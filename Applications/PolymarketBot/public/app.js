// Global state
let currentTab = 'queue';
let updateInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadWallets();
  await updateAll();

  // Start auto-refresh every 30 seconds
  updateInterval = setInterval(updateAll, 30000);

  // Setup news source type toggle
  document.querySelectorAll('input[name="news-source-type"]').forEach(radio => {
    radio.addEventListener('change', toggleNewsSourceFields);
  });
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

  container.innerHTML = articles.map(article => {
    // Determine match status badge
    let statusBadge = '';
    const matchStatus = article.matchStatus || 'pending';

    if (matchStatus === 'matched') {
      statusBadge = `<span class="match-status matched clickable" onclick="rematchArticle('${article.id}')" title="Click to recheck">✓ ${article.matchedMarkets || 0} Match${article.matchedMarkets !== 1 ? 'es' : ''}</span>`;
    } else if (matchStatus === 'no-match') {
      statusBadge = `<span class="match-status no-match clickable" onclick="rematchArticle('${article.id}')" title="Click to recheck">✗ No Match</span>`;
    } else if (matchStatus === 'processing') {
      statusBadge = `<span class="match-status processing">⏳ Processing...</span>`;
    } else if (matchStatus === 'error') {
      statusBadge = `<span class="match-status error clickable" onclick="rematchArticle('${article.id}')" title="Click to retry">⚠ Error</span>`;
    } else {
      statusBadge = `<span class="match-status pending clickable" onclick="rematchArticle('${article.id}')" title="Click to check">⋯ Pending</span>`;
    }

    return `
      <div class="news-card" id="news-${article.id}">
        <div class="title">${escapeHtml(article.title)}</div>
        <div class="meta">
          ${article.source} • ${timeAgo(article.publishedAt)}
          ${statusBadge}
        </div>
      </div>
    `;
  }).join('');
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

  container.innerHTML = matches.map(match => {
    // Highlight matched keywords in the news title
    let highlightedTitle = escapeHtml(match.newsTitle || 'News article');
    if (match.matchedKeywords && match.matchedKeywords.length > 0) {
      match.matchedKeywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        highlightedTitle = highlightedTitle.replace(regex, '<mark class="keyword-highlight">$1</mark>');
      });
    }

    return `
      <div class="match-card">
        <div class="news-title">${highlightedTitle}</div>
        <div class="market-question">
          ${escapeHtml(match.marketQuestion)}
          ${match.marketUrl ? `<a href="${match.marketUrl}" target="_blank" rel="noopener noreferrer" class="market-link" title="View on Polymarket">🔗</a>` : ''}
        </div>

        ${match.matchedKeywords && match.matchedKeywords.length > 0 ? `
          <div class="matched-keywords">
            <span class="keywords-label">Keywords:</span>
            ${match.matchedKeywords.map(kw => `<span class="keyword-tag">${escapeHtml(kw)}</span>`).join('')}
          </div>
        ` : ''}

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
    `;
  }).join('');
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
      <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <strong>Market:</strong> ${escapeHtml(trade.market.question)}
        ${trade.market.url ? `<a href="${trade.market.url}" target="_blank" rel="noopener noreferrer" class="market-link" title="View on Polymarket">🔗</a>` : ''}
      </div>

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

function toggleNewsSourceFields() {
  const sourceType = document.querySelector('input[name="news-source-type"]:checked').value;
  const apiKeyField = document.getElementById('newsapi-key-field');
  const rssInfo = document.getElementById('rss-info');

  if (sourceType === 'newsapi') {
    apiKeyField.style.display = 'block';
    rssInfo.style.display = 'none';
  } else {
    apiKeyField.style.display = 'none';
    rssInfo.style.display = 'block';
  }
}

async function loadSettings() {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();

    if (data.success) {
      const s = data.settings;

      // NewsAPI - Source Type
      const sourceType = s.newsApi.sourceType || 'rss';
      if (sourceType === 'rss') {
        document.getElementById('newsapi-source-rss').checked = true;
      } else {
        document.getElementById('newsapi-source-newsapi').checked = true;
      }
      toggleNewsSourceFields();

      document.getElementById('newsapi-key').value = s.newsApi.apiKey || '';
      document.getElementById('newsapi-sources').value = s.newsApi.sources.join(',');
      document.getElementById('newsapi-keywords').value = s.newsApi.keywords.join(',');
      document.getElementById('newsapi-enabled').checked = s.newsApi.enabled;

      // Polymarket - Note: Private keys are now managed via wallet management
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
  const sourceType = document.querySelector('input[name="news-source-type"]:checked').value;

  const updates = [
    {
      endpoint: '/api/settings/news',
      data: {
        sourceType: sourceType,
        apiKey: document.getElementById('newsapi-key').value,
        sources: document.getElementById('newsapi-sources').value.split(',').map(s => s.trim()),
        keywords: document.getElementById('newsapi-keywords').value.split(',').map(s => s.trim()),
        enabled: document.getElementById('newsapi-enabled').checked
      }
    },
    {
      endpoint: '/api/settings/polymarket',
      data: {
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

// Wallet Management
async function loadWallets() {
  try {
    const response = await fetch('/api/wallets');
    const data = await response.json();

    if (data.wallets) {
      renderWallets(data.wallets, data.activeWalletId);
    }
  } catch (error) {
    console.error('Error loading wallets:', error);
    document.getElementById('wallet-list').innerHTML = '<div class="empty">Error loading wallets</div>';
  }
}

function renderWallets(wallets, activeWalletId) {
  const container = document.getElementById('wallet-list');

  if (!wallets || wallets.length === 0) {
    container.innerHTML = '<div class="empty">No wallets added yet</div>';
    return;
  }

  container.innerHTML = wallets.map(wallet => `
    <div class="wallet-card ${wallet.isActive ? 'active' : ''}">
      <div style="display: flex; justify-content: space-between; align-items: start">
        <div style="flex: 1">
          <div style="font-weight: bold; margin-bottom: 0.25rem">
            ${escapeHtml(wallet.name)}
            ${wallet.isActive ? '<span style="color: var(--success); margin-left: 0.5rem">✓ Active</span>' : ''}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem">
            ${wallet.address}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-dim); font-family: monospace">
            ${wallet.privateKey}
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem">
          ${!wallet.isActive ? `<button class="btn-small" onclick="setActiveWallet('${wallet.id}')">Set Active</button>` : ''}
          <button class="btn-small btn-danger" onclick="removeWallet('${wallet.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

async function addWallet() {
  const name = document.getElementById('new-wallet-name').value.trim();
  const privateKey = document.getElementById('new-wallet-privatekey').value.trim();

  if (!name || !privateKey) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, privateKey })
    });

    const data = await response.json();

    if (data.success) {
      alert(`Wallet added successfully!\nAddress: ${data.wallet.address}`);
      // Clear form
      document.getElementById('new-wallet-name').value = '';
      document.getElementById('new-wallet-privatekey').value = '';
      // Reload wallets
      await loadWallets();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error adding wallet: ' + error.message);
  }
}

async function setActiveWallet(id) {
  try {
    const response = await fetch(`/api/wallets/active/${id}`, {
      method: 'PUT'
    });

    const data = await response.json();

    if (data.success) {
      alert('Active wallet updated!');
      await loadWallets();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error setting active wallet: ' + error.message);
  }
}

async function removeWallet(id) {
  if (!confirm('Are you sure you want to delete this wallet?')) {
    return;
  }

  try {
    const response = await fetch(`/api/wallets/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      alert('Wallet removed successfully!');
      await loadWallets();
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    alert('Error removing wallet: ' + error.message);
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

// Rematch article - rerun matching logic
async function rematchArticle(articleId) {
  try {
    // Find the article card and update the badge to show processing
    const articleCard = document.getElementById(`news-${articleId}`);
    if (articleCard) {
      const badge = articleCard.querySelector('.match-status');
      if (badge) {
        badge.className = 'match-status processing';
        badge.innerHTML = '⏳ Processing...';
        badge.onclick = null; // Disable clicking while processing
      }
    }

    console.log(`Rematching article ${articleId}...`);

    const response = await fetch(`/api/markets/rematch/${articleId}`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      console.log('Rematch successful:', data);
      // Wait a moment then refresh the news to get updated status
      setTimeout(async () => {
        await updateNews();
      }, 500);
    } else {
      alert('Error rematching article: ' + (data.error || 'Unknown error'));
      // Refresh anyway to restore the correct state
      await updateNews();
    }
  } catch (error) {
    console.error('Error rematching article:', error);
    alert('Error rematching article: ' + error.message);
    // Refresh to restore the correct state
    await updateNews();
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
