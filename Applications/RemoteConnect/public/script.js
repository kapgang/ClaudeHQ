// WebSocket connection
let ws = null;
let devices = [];
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

// DOM Elements
const wsStatus = document.getElementById('wsStatus');
const wsStatusText = document.getElementById('wsStatusText');
const deviceCount = document.getElementById('deviceCount');
const devicesGrid = document.getElementById('devicesGrid');
const refreshBtn = document.getElementById('refreshBtn');
const scanBtn = document.getElementById('scanBtn');
const deviceModal = document.getElementById('deviceModal');
const modalClose = document.getElementById('modalClose');
const modalDeviceName = document.getElementById('modalDeviceName');
const modalBody = document.getElementById('modalBody');

// Connect WebSocket
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket connected');
    reconnectAttempts = 0;
    updateWSStatus(true);
    // Request device list
    loadDevices();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (err) {
      console.error('Error parsing WebSocket message:', err);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateWSStatus(false);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    updateWSStatus(false);
    
    // Attempt to reconnect
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(connectWebSocket, 3000);
    }
  };
}

// Update WebSocket status indicator
function updateWSStatus(connected) {
  if (connected) {
    wsStatus.className = 'status-dot connected';
    wsStatusText.textContent = 'Connected';
  } else {
    wsStatus.className = 'status-dot disconnected';
    wsStatusText.textContent = 'Disconnected';
  }
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'devices':
      devices = data.devices || [];
      renderDevices();
      break;
    case 'deviceEvent':
      // Device state changed, reload devices
      loadDevices();
      break;
    case 'inputResult':
      console.log('Input result:', data.result);
      break;
    case 'pong':
      // Keep-alive response
      break;
  }
}

// Load devices from API
async function loadDevices() {
  try {
    const response = await fetch('/api/devices');
    const data = await response.json();
    devices = data.devices || [];
    renderDevices();
  } catch (err) {
    console.error('Error loading devices:', err);
  }
}

// Render devices grid
function renderDevices() {
  deviceCount.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''}`;

  if (devices.length === 0) {
    devicesGrid.innerHTML = `
      <div class="empty-state">
        <p>📱 No devices detected</p>
        <p class="hint">Connect your Android devices via USB and enable USB debugging</p>
        <p class="hint">Make sure ADB is installed and in your PATH</p>
      </div>
    `;
    return;
  }

  devicesGrid.innerHTML = devices.map(device => createDeviceCard(device)).join('');
}

// Create device card HTML
function createDeviceCard(device) {
  const statusBadges = [];
  if (device.connected) {
    statusBadges.push('<span class="status-badge connected">Connected</span>');
  } else {
    statusBadges.push('<span class="status-badge disconnected">Offline</span>');
  }
  if (device.streaming) {
    statusBadges.push('<span class="status-badge streaming">Streaming</span>');
  }

  const proxyStatus = device.proxy
    ? `<div class="proxy-status active">Proxy: ${device.proxy.type}://${device.proxy.host}:${device.proxy.port}</div>`
    : '<div class="proxy-status inactive">No proxy configured</div>';

  return `
    <div class="device-card ${device.connected ? '' : 'disconnected'}">
      <div class="device-header">
        <div class="device-info">
          <h3>${device.model || 'Unknown Device'}</h3>
          <div class="device-model">${device.manufacturer || ''} ${device.brand || ''}</div>
          <div class="device-serial">${device.serial}</div>
        </div>
        <div class="device-status">
          ${statusBadges.join('')}
        </div>
      </div>
      
      <div class="device-details">
        <div class="detail-row">
          <span class="detail-label">Android Version:</span>
          <span class="detail-value">${device.androidVersion || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">SDK:</span>
          <span class="detail-value">${device.sdkVersion || 'Unknown'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Product:</span>
          <span class="detail-value">${device.product || 'Unknown'}</span>
        </div>
      </div>

      ${proxyStatus}

      <div class="device-actions">
        ${device.connected
          ? `
            <button class="btn btn-primary btn-small" onclick="openDeviceModal('${device.serial}')" title="Settings">
              ⚙️
            </button>
            <button class="btn btn-success btn-small" onclick="openStreamModal('${device.serial}')">
              📺 Stream
            </button>
            <button class="btn btn-secondary btn-small" onclick="configureProxy('${device.serial}')">
              🔒 Proxy
            </button>
            <button class="btn btn-danger btn-small" onclick="disconnectDevice('${device.serial}')" title="Stop Connection">
              ⏹ Stop
            </button>
          `
          : `
            <button class="btn btn-primary btn-small" onclick="connectDevice('${device.serial}')">
              🔌 Connect
            </button>
          `
        }
      </div>
    </div>
  `;
}

// Connect device
async function connectDevice(serial) {
  try {
    const response = await fetch(`/api/devices/${serial}/connect`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
    } else {
      alert('Failed to connect device: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error connecting device:', err);
    alert('Error connecting device: ' + err.message);
  }
}

// Disconnect device
async function disconnectDevice(serial) {
  if (!confirm('Disconnect this device?')) return;

  try {
    const response = await fetch(`/api/devices/${serial}/disconnect`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
    } else {
      alert('Failed to disconnect device: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error disconnecting device:', err);
    alert('Error disconnecting device: ' + err.message);
  }
}

// Start stream
async function startStream(serial) {
  try {
    const response = await fetch(`/api/devices/${serial}/stream/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maxSize: 1024,
        bitrate: 2000000,
        maxFps: 30
      })
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
      if (data.note) {
        alert(data.note);
      }
    } else {
      alert('Failed to start stream: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error starting stream:', err);
    alert('Error starting stream: ' + err.message);
  }
}

// Stop stream
async function stopStream(serial) {
  try {
    const response = await fetch(`/api/devices/${serial}/stream/stop`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
    } else {
      alert('Failed to stop stream: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error stopping stream:', err);
    alert('Error stopping stream: ' + err.message);
  }
}

// Configure proxy
async function configureProxy(serial) {
  const device = devices.find(d => d.serial === serial);
  if (!device) return;

  const proxyHost = prompt('Proxy Host:', device.proxy?.host || '');
  if (!proxyHost) return;

  const proxyPort = prompt('Proxy Port:', device.proxy?.port || '8080');
  if (!proxyPort) return;

  const proxyType = prompt('Proxy Type (http/socks5):', device.proxy?.type || 'http') || 'http';

  try {
    const response = await fetch(`/api/devices/${serial}/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: proxyType,
        host: proxyHost,
        port: parseInt(proxyPort)
      })
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
      alert('Proxy configured successfully');
    } else {
      alert('Failed to configure proxy: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error configuring proxy:', err);
    alert('Error configuring proxy: ' + err.message);
  }
}

// Remove proxy
async function removeProxy(serial) {
  if (!confirm('Remove proxy configuration?')) return;

  try {
    const response = await fetch(`/api/devices/${serial}/proxy`, {
      method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
      alert('Proxy removed successfully');
    } else {
      alert('Failed to remove proxy: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error removing proxy:', err);
    alert('Error removing proxy: ' + err.message);
  }
}

// Open device modal for detailed controls
function openDeviceModal(serial) {
  const device = devices.find(d => d.serial === serial);
  if (!device) return;

  modalDeviceName.textContent = `${device.model || 'Device'} Controls`;
  
  modalBody.innerHTML = `
    <div class="device-details">
      <h3>Device Information</h3>
      <div class="detail-row">
        <span class="detail-label">Serial:</span>
        <span class="detail-value">${device.serial}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Model:</span>
        <span class="detail-value">${device.model || 'Unknown'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Manufacturer:</span>
        <span class="detail-value">${device.manufacturer || 'Unknown'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Android:</span>
        <span class="detail-value">${device.androidVersion || 'Unknown'}</span>
      </div>
    </div>

    <div class="screen-preview-container">
      <div class="screen-preview-header">
        <h3>Device Screen</h3>
        <button class="btn btn-secondary btn-small" onclick="refreshScreenshot('${serial}')">🔄 Refresh</button>
      </div>
      <div class="screen-preview" id="screenPreview_${serial}">
        <img id="screenImage_${serial}" 
             src="/api/devices/${serial}/screenshot" 
             alt="Device Screen" 
             style="max-width: 100%; height: auto; display: block; cursor: crosshair;" 
             onclick="handleScreenClick(event, '${serial}')"
             onerror="this.parentElement.innerHTML='<p>Error loading screenshot. Make sure device is connected.</p>'">
        <div class="screen-click-hint">Click anywhere on the screen to tap</div>
      </div>
    </div>

    <div class="proxy-form">
      <h3>Proxy Configuration</h3>
      ${device.proxy
        ? `
          <p>Current Proxy: <strong>${device.proxy.type}://${device.proxy.host}:${device.proxy.port}</strong></p>
          <button class="btn btn-danger" onclick="removeProxy('${serial}'); closeModal();">Remove Proxy</button>
        `
        : '<p>No proxy configured</p>'
      }
      <div class="form-group">
        <label>Proxy Host:</label>
        <input type="text" id="proxyHost" placeholder="proxy.example.com">
      </div>
      <div class="form-group">
        <label>Proxy Port:</label>
        <input type="number" id="proxyPort" placeholder="8080" value="8080">
      </div>
      <div class="form-group">
        <label>Proxy Type:</label>
        <select id="proxyType">
          <option value="http">HTTP</option>
          <option value="socks5">SOCKS5</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="saveProxy('${serial}')">Apply Proxy</button>
      <button class="btn btn-secondary" onclick="testProxy('${serial}')">Test Connection</button>
    </div>

    <div>
      <h3>Quick Actions</h3>
      <div class="device-actions">
        <button class="btn btn-secondary" onclick="sendInput('${serial}', 'home')">🏠 Home</button>
        <button class="btn btn-secondary" onclick="sendInput('${serial}', 'back')">⬅ Back</button>
        <button class="btn btn-secondary" onclick="sendInput('${serial}', 'menu')">☰ Menu</button>
        <button class="btn btn-secondary" onclick="sendInput('${serial}', 'launchChrome')">🌐 Chrome</button>
      </div>
    </div>
  `;

  deviceModal.classList.add('show');
  // Start auto-refreshing screenshot
  startScreenshotRefresh(serial);
  // Load initial screenshot
  refreshScreenshot(serial);
}

// Close modal
function closeModal() {
  deviceModal.classList.remove('show');
  // Stop auto-refreshing screenshot
  stopScreenshotRefresh();
}

// Save proxy from modal
async function saveProxy(serial) {
  const host = document.getElementById('proxyHost').value;
  const port = document.getElementById('proxyPort').value;
  const type = document.getElementById('proxyType').value;

  if (!host || !port) {
    alert('Please enter proxy host and port');
    return;
  }

  try {
    const response = await fetch(`/api/devices/${serial}/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, host, port: parseInt(port) })
    });
    const data = await response.json();
    
    if (data.success) {
      loadDevices();
      closeModal();
      alert('Proxy configured successfully');
    } else {
      alert('Failed to configure proxy: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving proxy:', err);
    alert('Error saving proxy: ' + err.message);
  }
}

// Test proxy
async function testProxy(serial) {
  const host = document.getElementById('proxyHost').value;
  const port = document.getElementById('proxyPort').value;

  if (!host || !port) {
    alert('Please enter proxy host and port');
    return;
  }

  try {
    const response = await fetch(`/api/devices/${serial}/proxy/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port: parseInt(port) })
    });
    const data = await response.json();
    
    if (data.reachable) {
      alert('✓ Proxy is reachable');
    } else {
      alert('✗ Proxy is not reachable');
    }
  } catch (err) {
    console.error('Error testing proxy:', err);
    alert('Error testing proxy: ' + err.message);
  }
}

// Handle click on screen image
async function handleScreenClick(event, serial) {
  const img = event.target;
  const rect = img.getBoundingClientRect();
  
  // Get click coordinates relative to the image
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  
  // Get actual image dimensions (natural size)
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  
  // Get displayed image dimensions
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  
  // Calculate scale factors
  const scaleX = naturalWidth / displayWidth;
  const scaleY = naturalHeight / displayHeight;
  
  // Convert click coordinates to device coordinates
  const deviceX = Math.round(clickX * scaleX);
  const deviceY = Math.round(clickY * scaleY);
  
  // Send tap command
  try {
    const response = await fetch(`/api/devices/${serial}/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'tap',
        x: deviceX,
        y: deviceY
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Refresh screenshot after tap to show the result
      setTimeout(() => refreshScreenshot(serial), 300);
    } else {
      console.error('Tap failed:', result.error);
    }
  } catch (err) {
    console.error('Error sending tap:', err);
  }
}

// Refresh screenshot
async function refreshScreenshot(serial) {
  const img = document.getElementById(`screenImage_${serial}`);
  if (img) {
    // Add timestamp to force refresh
    img.src = `/api/devices/${serial}/screenshot?t=${Date.now()}`;
  }
}

// Auto-refresh screenshot every 2 seconds when modal is open
let screenshotInterval = null;
function startScreenshotRefresh(serial) {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  screenshotInterval = setInterval(() => {
    refreshScreenshot(serial);
  }, 2000);
}

function stopScreenshotRefresh() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
}

// Send input command
async function sendInput(serial, type) {
  try {
    const response = await fetch(`/api/devices/${serial}/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    const data = await response.json();
    
    if (!data.success) {
      alert('Input failed: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error sending input:', err);
    alert('Error sending input: ' + err.message);
  }
}

// Event listeners
refreshBtn.addEventListener('click', loadDevices);
scanBtn.addEventListener('click', loadDevices);
modalClose.addEventListener('click', closeModal);
deviceModal.addEventListener('click', (e) => {
  if (e.target === deviceModal) {
    closeModal();
  }
});

// Initialize
connectWebSocket();
loadDevices();

// Keep-alive ping
setInterval(() => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
