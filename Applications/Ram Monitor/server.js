const express = require('express');
const path = require('path');

const app = express();
const PORT = 9999;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Ram Monitor server running on http://localhost:${PORT}`);
});
