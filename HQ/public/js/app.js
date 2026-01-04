// Utility functions
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Update time display
function updateTime() {
  const now = new Date();
  document.getElementById('time').textContent = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Fetch and display system stats
async function updateSystemStats() {
  try {
    const response = await fetch('/api/system');
    const data = await response.json();

    // CPU
    document.getElementById('cpu-value').textContent = data.cpu.usage + '%';
    document.getElementById('cpu-bar').style.width = data.cpu.usage + '%';
    document.getElementById('cpu-detail').textContent = `${data.cpu.cores} cores`;

    // Memory
    document.getElementById('ram-value').textContent = data.memory.percentage + '%';
    document.getElementById('ram-bar').style.width = data.memory.percentage + '%';
    document.getElementById('ram-detail').textContent =
      `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`;

    // Disk
    document.getElementById('disk-value').textContent = data.disk.percentage + '%';
    document.getElementById('disk-bar').style.width = data.disk.percentage + '%';
    document.getElementById('disk-detail').textContent =
      `${formatBytes(data.disk.used)} / ${formatBytes(data.disk.total)}`;

    // Uptime
    document.getElementById('uptime-value').textContent = formatUptime(data.uptime);
    document.getElementById('uptime-detail').textContent = data.hostname;

  } catch (error) {
    console.error('Failed to fetch system stats:', error);
  }
}

// Icon map for app cards
const iconMap = {
  chrome: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>',
  phone: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M11 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h6zM5 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H5z"/><path d="M8 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>',
  memory: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M1 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.586a1 1 0 0 0 .707-.293l.353-.353a.5.5 0 0 1 .708 0l.353.353a1 1 0 0 0 .707.293H15a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H1zm.5 1h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zm5 0h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5zm4.5.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-4z"/></svg>',
  wallet: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 3a2 2 0 0 1 2-2h13.5a.5.5 0 0 1 0 1H15v2a1 1 0 0 1 1 1v8.5a1.5 1.5 0 0 1-1.5 1.5h-12A2.5 2.5 0 0 1 0 12.5V3zm1 1.732V12.5A1.5 1.5 0 0 0 2.5 14h12a.5.5 0 0 0 .5-.5V5H2a1.99 1.99 0 0 1-1-.268zM1 3a1 1 0 0 0 1 1h12V2H2a1 1 0 0 0-1 1z"/></svg>',
  brain: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zm0 1a.5.5 0 0 1 .5.5V2h8V1.5a.5.5 0 0 1 1 0V2h1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h1V1.5a.5.5 0 0 1 .5-.5z"/></svg>',
  newspaper: '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2.5A1.5 1.5 0 0 1 1.5 1h11A1.5 1.5 0 0 1 14 2.5v10.528c0 .3-.05.654-.238.972h.738a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 1 1 0v9a1.5 1.5 0 0 1-1.5 1.5H1.497A1.497 1.497 0 0 1 0 13.5v-11zM12 14c.37 0 .654-.211.853-.441.092-.106.147-.279.147-.531V2.5a.5.5 0 0 0-.5-.5h-11a.5.5 0 0 0-.5.5v11c0 .278.223.5.497.5H12z"/><path d="M2 3h10v2H2V3zm0 3h4v3H2V6zm0 4h4v1H2v-1zm0 2h4v1H2v-1zm5-6h2v1H7V6zm3 0h2v1h-2V6zM7 8h2v1H7V8zm3 0h2v1h-2V8zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1zm-3 2h2v1H7v-1zm3 0h2v1h-2v-1z"/></svg>'
};

// Fetch and display servers
async function updateServers(forceRebuild = false) {
  try {
    const response = await fetch('/api/servers');
    const data = await response.json();

    const grid = document.getElementById('apps-grid');

    // Color mapping for apps
    const getColorWithShadow = (color) => {
      const shadowMap = {
        '#a855f7': 'rgba(168, 85, 247, 0.3)',
        '#00d4ff': 'rgba(0, 212, 255, 0.3)',
        '#ff6b35': 'rgba(255, 107, 53, 0.3)',
        '#ff5757': 'rgba(255, 87, 87, 0.3)',
        '#10b981': 'rgba(16, 185, 129, 0.3)',
        '#f59e0b': 'rgba(245, 158, 11, 0.3)',
        '#00b4d8': 'rgba(0, 180, 216, 0.3)'
      };
      return shadowMap[color] || 'rgba(0, 0, 0, 0.2)';
    };

    // Only rebuild if forced or grid is empty
    if (forceRebuild || grid.children.length === 0) {
      grid.innerHTML = '';
      data.servers.forEach((server, index) => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.style.setProperty('--app-color', server.color);
        tile.style.setProperty('--app-color-shadow', getColorWithShadow(server.color));
        tile.dataset.serverId = server.id;

        tile.innerHTML = `
          <div class="app-top">
            <div class="app-details">
              <div class="app-title">${server.name}</div>
              <div class="app-subtitle">${server.description}</div>
            </div>
            <div class="app-indicator ${server.running ? 'running' : 'stopped'}">
              ${server.running ? 'Running' : 'Stopped'}
            </div>
          </div>
          <div class="app-buttons">
            ${server.running ? `
              <button class="app-btn secondary" onclick="openApp('${server.url}')">Open</button>
              <button class="app-btn secondary" onclick="stopServer('${server.id}', this)">Stop</button>
            ` : `
              <button class="app-btn primary" onclick="startServer('${server.id}', this)">Start</button>
            `}
          </div>
        `;

        grid.appendChild(tile);
      });
    } else {
      // Update existing tiles
      data.servers.forEach(server => {
        const tile = grid.querySelector(`[data-server-id="${server.id}"]`);
        if (!tile) return;

        const indicator = tile.querySelector('.app-indicator');
        const buttons = tile.querySelector('.app-buttons');

        // Update indicator
        indicator.className = `app-indicator ${server.running ? 'running' : 'stopped'}`;
        indicator.textContent = server.running ? 'Running' : 'Stopped';

        // Update buttons
        buttons.innerHTML = server.running ? `
          <button class="app-btn secondary" onclick="openApp('${server.url}')">Open</button>
          <button class="app-btn secondary" onclick="stopServer('${server.id}', this)">Stop</button>
        ` : `
          <button class="app-btn primary" onclick="startServer('${server.id}', this)">Start</button>
        `;
      });
    }

  } catch (error) {
    console.error('Failed to fetch servers:', error);
  }
}

// Server controls
async function startServer(id, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>';

  try {
    const response = await fetch(`/api/servers/${id}/start`, { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message, 'success');
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    showToast('Failed to start server', 'error');
  }

  await updateServers(); // Only update existing tiles, don't rebuild
  await updateLogs();
}

async function stopServer(id, btn) {
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span>';

  try {
    const response = await fetch(`/api/servers/${id}/stop`, { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message, 'success');
    } else {
      showToast(data.error, 'error');
    }
  } catch (error) {
    showToast('Failed to stop server', 'error');
  }

  await updateServers(); // Only update existing tiles, don't rebuild
  await updateLogs();
}

function openApp(url) {
  window.open(url, '_blank');
}

// Console logs
async function updateLogs() {
  try {
    const response = await fetch('/api/logs?limit=100');
    const data = await response.json();

    const consoleBody = document.getElementById('console-body');

    if (data.logs.length === 0) {
      consoleBody.innerHTML = '<div class="console-empty">Awaiting system events...</div>';
      return;
    }

    consoleBody.innerHTML = data.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `
        <div class="console-line ${log.type}">
          <span class="console-timestamp">${time}</span>
          <span class="console-source">[${log.source}]</span>
          <span class="console-message">${log.message}</span>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Failed to fetch logs:', error);
  }
}

async function clearLogs() {
  await fetch('/api/logs/clear', { method: 'POST' });
  await updateLogs();
}

// Restart HQ functionality
function showRestartModal() {
  const modal = document.getElementById('restart-modal');
  modal.classList.add('active');
}

function hideRestartModal() {
  const modal = document.getElementById('restart-modal');
  modal.classList.remove('active');
}

async function restartHQ() {
  try {
    hideRestartModal();
    showToast('Restarting HQ server...', 'info');

    const response = await fetch('/api/system/restart', { method: 'POST' });
    const data = await response.json();

    if (response.ok) {
      showToast(data.message, 'success');
      // Wait a bit before reloading
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showToast(data.error || 'Failed to restart HQ', 'error');
    }
  } catch (error) {
    showToast('Failed to communicate with server', 'error');
  }
}

// Initialize application
function init() {
  // Start time updates
  setInterval(updateTime, 1000);
  updateTime();

  // Initial data load
  updateSystemStats();
  updateServers();
  updateLogs();

  // Polling intervals
  setInterval(updateSystemStats, 2000);
  setInterval(updateServers, 3000);
  setInterval(updateLogs, 2000);

  // Restart button event listeners
  document.getElementById('restart-btn').addEventListener('click', showRestartModal);
  document.getElementById('cancel-restart').addEventListener('click', hideRestartModal);
  document.getElementById('confirm-restart').addEventListener('click', restartHQ);

  // Close modal on overlay click
  document.getElementById('restart-modal').addEventListener('click', (e) => {
    if (e.target.id === 'restart-modal') {
      hideRestartModal();
    }
  });
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
