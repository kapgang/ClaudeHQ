const express = require('express');
const path = require('path');
const routes = require('./routes');
const { addLog } = require('./services/logger');

const app = express();
const PORT = 8888;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API Routes
app.use('/api', routes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize and start server
addLog('HQ', 'Command Center initialized', 'system');

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║      ██╗  ██╗ ██████╗                         ║
  ║      ██║  ██║██╔═══██╗                        ║
  ║      ███████║██║   ██║                        ║
  ║      ██╔══██║██║▄▄ ██║                        ║
  ║      ██║  ██║╚██████╔╝                        ║
  ║      ╚═╝  ╚═╝ ╚══▀▀═╝                         ║
  ║                                               ║
  ║      Command Center v1.0                      ║
  ║      http://localhost:${PORT}                    ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
  addLog('HQ', `Server running on port ${PORT}`, 'success');
});
