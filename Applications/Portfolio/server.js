const express = require('express');
const path = require('path');

// Import routes
const trackerRoutes = require('./routes/tracker');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = 4444;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Mount routes
app.use('/api/tracker', trackerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Legacy API compatibility - redirect old endpoints to new ones
app.use('/api/upload', (req, res, next) => {
  req.url = '/api/tracker/upload';
  app._router.handle(req, res, next);
});

app.use('/api/transactions', (req, res, next) => {
  req.url = '/api/tracker/transactions' + (req.url === '/' ? '' : req.url);
  app._router.handle(req, res, next);
});

app.use('/api/categories', (req, res, next) => {
  req.url = '/api/tracker/categories';
  app._router.handle(req, res, next);
});

app.use('/api/merchants', (req, res, next) => {
  req.url = '/api/tracker/merchants';
  app._router.handle(req, res, next);
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
  ║   ██████╗  ██████╗ ██████╗ ████████╗███████╗ ██████╗      ║
  ║   ██╔══██╗██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗     ║
  ║   ██████╔╝██║   ██║██████╔╝   ██║   █████╗  ██║   ██║     ║
  ║   ██╔═══╝ ██║   ██║██╔══██╗   ██║   ██╔══╝  ██║   ██║     ║
  ║   ██║     ╚██████╔╝██║  ██║   ██║   ██║     ╚██████╔╝     ║
  ║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝      ║
  ║                                                           ║
  ║   Portfolio - Personal Finance Manager                    ║
  ║   http://localhost:${PORT}                                    ║
  ║                                                           ║
  ║   Modules:                                                ║
  ║   - Tracker: Credit Card Statement Analyzer               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
