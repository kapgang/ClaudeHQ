const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../utils/data');

// Get all fingerprints
router.get('/', (req, res) => {
  const fingerprints = db.fingerprints.getAll();
  res.json({ fingerprints });
});

// Create new fingerprint
router.post('/', (req, res) => {
  const { name, userAgent, viewport, language, timezone, platform } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const fingerprints = db.fingerprints.getAll();
  const fingerprint = {
    id: uuidv4(),
    name,
    userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: viewport || { width: 1920, height: 1080 },
    language: language || 'en-US',
    timezone: timezone || 'America/New_York',
    platform: platform || 'Win32',
    isPreset: false,
    createdAt: new Date().toISOString()
  };

  fingerprints.push(fingerprint);
  db.fingerprints.save(fingerprints);
  res.json({ success: true, fingerprint });
});

// Delete fingerprint
router.delete('/:id', (req, res) => {
  const fingerprints = db.fingerprints.getAll();
  const fp = fingerprints.find(f => f.id === req.params.id);

  if (!fp) {
    return res.status(404).json({ error: 'Fingerprint not found' });
  }

  if (fp.isPreset) {
    return res.status(400).json({ error: 'Cannot delete preset fingerprints' });
  }

  const index = fingerprints.findIndex(f => f.id === req.params.id);
  fingerprints.splice(index, 1);
  db.fingerprints.save(fingerprints);
  res.json({ success: true });
});

module.exports = router;
