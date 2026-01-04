const express = require('express');
const path = require('path');

const app = express();
const PORT = 7777;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// API routes (for future device connection functionality)
app.get('/api/devices', (req, res) => {
  // Placeholder for device list endpoint
  res.json({ devices: [] });
});

app.post('/api/devices/connect', (req, res) => {
  // Placeholder for device connection endpoint
  res.json({ message: 'Device connection endpoint - to be implemented' });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Cellular Device Manager is ready!');
});
