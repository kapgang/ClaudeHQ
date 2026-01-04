const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');

const app = express();
const PORT = 3333;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ideas', require('./routes/ideas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY
  });
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
  ║    █████╗ ███████╗███████╗██╗███████╗████████╗           ║
  ║   ██╔══██╗██╔════╝██╔════╝██║██╔════╝╚══██╔══╝           ║
  ║   ███████║███████╗███████╗██║███████╗   ██║              ║
  ║   ██╔══██║╚════██║╚════██║██║╚════██║   ██║              ║
  ║   ██║  ██║███████║███████║██║███████║   ██║              ║
  ║   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ╚═╝              ║
  ║                                                           ║
  ║   Work Assistant - Claude Powered                         ║
  ║   http://localhost:${PORT}                                    ║
  ║                                                           ║
  ║   API Key: ${process.env.ANTHROPIC_API_KEY ? 'Configured ✓' : 'Missing ✗'}                               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
