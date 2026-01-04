const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 2222;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount routes
app.use('/api/news', require('./routes/news'));
app.use('/api/markets', require('./routes/markets'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/wallets', require('./routes/wallets'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   ██████╗  ██████╗ ██╗  ██╗   ██╗███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗
  ║   ██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝
  ║   ██████╔╝██║   ██║██║   ╚████╔╝ ██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║
  ║   ██╔═══╝ ██║   ██║██║    ╚██╔╝  ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║
  ║   ██║     ╚██████╔╝███████╗██║   ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║
  ║   ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝
  ║                                                           ║
  ║   ██████╗  ██████╗ ████████╗                             ║
  ║   ██╔══██╗██╔═══██╗╚══██╔══╝                             ║
  ║   ██████╔╝██║   ██║   ██║                                ║
  ║   ██╔══██╗██║   ██║   ██║                                ║
  ║   ██████╔╝╚██████╔╝   ██║                                ║
  ║   ╚═════╝  ╚═════╝    ╚═╝                                ║
  ║                                                           ║
  ║   AI-Powered Auto-Trader                                 ║
  ║   http://localhost:${PORT}                                    ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // Start news polling if enabled
  const newsService = require('./services/newsService');
  newsService.startPolling().catch(err => {
    console.error('Failed to start news polling:', err);
  });
});
