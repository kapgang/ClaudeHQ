const path = require('path');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const terminalService = require('./services/terminal');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3333;

// WebSocket connection handler for terminal
wss.on('connection', (ws) => {
  const terminalId = Date.now().toString();
  let terminal = null;

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);

      switch (msg.type) {
        case 'start':
          // Start Claude Code in the Assistant directory
          const workDir = msg.workingDir || 'C:\\Users\\kapla\\OneDrive\\Desktop\\Claude HQ\\Applications\\Assistant';
          terminal = terminalService.startClaudeCode(terminalId, ws, workDir);
          ws.send(JSON.stringify({ type: 'started', id: terminalId }));
          break;

        case 'input':
          terminalService.write(terminalId, msg.data);
          break;

        case 'resize':
          terminalService.resize(terminalId, msg.cols, msg.rows);
          break;
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });

  ws.on('close', () => {
    terminalService.kill(terminalId);
  });
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/api/ideas', require('./routes/ideas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║    █████╗ ███████╗███████╗██╗███████╗████████╗           ║
  ║   ██╔══██╗██╔════╝██╔════╝██║██╔════╝╚══██╔══╝           ║
  ║   ███████║███████╗███████╗██║███████╗   ██║              ║
  ║   ██╔══██║╚════██║╚════██║██║╚════██║   ██║              ║
  ║   ██║  ██║███████║███████║██║███████║   ██║              ║
  ║   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ╚═╝              ║
  ║                                                           ║
  ║   Work Assistant - Claude Code Terminal                   ║
  ║   http://localhost:${PORT}                                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
