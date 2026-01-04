const express = require('express');
const path = require('path');

// Import routes
const { router: sessionsRouter, activeBrowsers } = require('./routes/sessions');
const accountsRouter = require('./routes/accounts');
const proxiesRouter = require('./routes/proxies');
const fingerprintsRouter = require('./routes/fingerprints');
const tasksRouter = require('./routes/tasks');

const app = express();
const PORT = 5555;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Mount routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/proxies', proxiesRouter);
app.use('/api/fingerprints', fingerprintsRouter);
app.use('/api', tasksRouter);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
   ██████╗██╗  ██╗██████╗  ██████╗ ███╗   ███╗███████╗██████╗  ██████╗ ████████╗
  ██╔════╝██║  ██║██╔══██╗██╔═══██╗████╗ ████║██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝
  ██║     ███████║██████╔╝██║   ██║██╔████╔██║█████╗  ██████╔╝██║   ██║   ██║
  ██║     ██╔══██║██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝  ██╔══██╗██║   ██║   ██║
  ╚██████╗██║  ██║██║  ██║╚██████╔╝██║ ╚═╝ ██║███████╗██████╔╝╚██████╔╝   ██║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═════╝  ╚═════╝    ╚═╝

  Browser Session Manager v1.0
  http://localhost:${PORT}
  `);
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  for (const [id, browser] of activeBrowsers) {
    await browser.close();
  }
  process.exit(0);
});
