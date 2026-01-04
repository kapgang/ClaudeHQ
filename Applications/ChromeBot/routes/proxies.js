const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../utils/data');

// Get all proxies
router.get('/', (req, res) => {
  const proxies = db.proxies.getAll();
  res.json({ proxies });
});

// Add new proxy
router.post('/', (req, res) => {
  const { name, host, port, username, password, type } = req.body;

  if (!host || !port) {
    return res.status(400).json({ error: 'Host and port are required' });
  }

  const proxies = db.proxies.getAll();
  const proxy = {
    id: uuidv4(),
    name: name || `${host}:${port}`,
    host,
    port: parseInt(port),
    username: username || '',
    password: password || '',
    type: type || 'http',
    createdAt: new Date().toISOString()
  };

  proxies.push(proxy);
  db.proxies.save(proxies);
  res.json({ success: true, proxy });
});

// Delete proxy
router.delete('/:id', (req, res) => {
  const proxies = db.proxies.getAll();
  const index = proxies.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Proxy not found' });
  }

  proxies.splice(index, 1);
  db.proxies.save(proxies);
  res.json({ success: true });
});

// Test proxy connectivity
router.post('/:id/test', async (req, res) => {
  const puppeteer = require('puppeteer-extra');

  const proxies = db.proxies.getAll();
  const proxy = proxies.find(p => p.id === req.params.id);

  if (!proxy) {
    return res.status(404).json({ error: 'Proxy not found' });
  }

  try {
    const proxyUrl = proxy.type === 'socks5'
      ? `socks5://${proxy.host}:${proxy.port}`
      : `http://${proxy.host}:${proxy.port}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxyUrl}`]
    });

    const page = await browser.newPage();

    if (proxy.username && proxy.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password
      });
    }

    await page.goto('https://api.ipify.org?format=json', { timeout: 10000 });
    const content = await page.content();
    await browser.close();

    const ipMatch = content.match(/"ip":"([^"]+)"/);
    const ip = ipMatch ? ipMatch[1] : 'Unknown';

    res.json({ success: true, ip, message: `Proxy working! IP: ${ip}` });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;
