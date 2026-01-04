const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, PROFILES_DIR } = require('../utils/data');
const { executeAccountTask, accountTasks } = require('../tasks');

// Puppeteer with stealth plugin
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Active browser instances (shared state)
const activeBrowsers = new Map();

// Apply fingerprint to page
async function applyFingerprint(page, fingerprint) {
  if (fingerprint.userAgent) {
    await page.setUserAgent(fingerprint.userAgent);
  }

  if (fingerprint.viewport) {
    await page.setViewport(fingerprint.viewport);
  }

  // Override navigator properties
  await page.evaluateOnNewDocument((fp) => {
    if (fp.language) {
      Object.defineProperty(navigator, 'language', { get: () => fp.language });
      Object.defineProperty(navigator, 'languages', { get: () => [fp.language, 'en'] });
    }
    if (fp.platform) {
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
    }
    if (fp.timezone) {
      const tz = fp.timezone;
      const DateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(locale, options) {
        options = options || {};
        options.timeZone = options.timeZone || tz;
        return new DateTimeFormat(locale, options);
      };
    }
  }, fingerprint);
}

// Get all sessions
router.get('/', (req, res) => {
  const sessions = db.sessions.getAll();
  const accounts = db.accounts.getAll();
  const proxies = db.proxies.getAll();
  const fingerprints = db.fingerprints.getAll();

  // Enrich sessions with related data and running status
  const enriched = sessions.map(session => ({
    ...session,
    account: accounts.find(a => a.id === session.accountId) || null,
    proxy: proxies.find(p => p.id === session.proxyId) || null,
    fingerprint: fingerprints.find(f => f.id === session.fingerprintId) || null,
    isRunning: activeBrowsers.has(session.id)
  }));

  res.json({ sessions: enriched });
});

// Create new session
router.post('/', (req, res) => {
  const { name, accountId, proxyId, fingerprintId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Session name is required' });
  }

  const sessions = db.sessions.getAll();
  const session = {
    id: uuidv4(),
    name,
    accountId: accountId || null,
    proxyId: proxyId || null,
    fingerprintId: fingerprintId || null,
    createdAt: new Date().toISOString()
  };

  sessions.push(session);
  db.sessions.save(sessions);

  // Create profile directory
  const profileDir = path.join(PROFILES_DIR, session.id);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }

  res.json({ success: true, session });
});

// Update session
router.put('/:id', (req, res) => {
  const { name, accountId, proxyId, fingerprintId } = req.body;
  const sessions = db.sessions.getAll();
  const index = sessions.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }

  sessions[index] = {
    ...sessions[index],
    name: name || sessions[index].name,
    accountId: accountId !== undefined ? accountId : sessions[index].accountId,
    proxyId: proxyId !== undefined ? proxyId : sessions[index].proxyId,
    fingerprintId: fingerprintId !== undefined ? fingerprintId : sessions[index].fingerprintId
  };

  db.sessions.save(sessions);
  res.json({ success: true, session: sessions[index] });
});

// Delete session
router.delete('/:id', async (req, res) => {
  const sessions = db.sessions.getAll();
  const index = sessions.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Stop browser if running
  if (activeBrowsers.has(req.params.id)) {
    const browser = activeBrowsers.get(req.params.id);
    await browser.close();
    activeBrowsers.delete(req.params.id);
  }

  // Remove profile directory
  const profileDir = path.join(PROFILES_DIR, req.params.id);
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true });
  }

  sessions.splice(index, 1);
  db.sessions.save(sessions);
  res.json({ success: true });
});

// Launch browser session
router.post('/:id/launch', async (req, res) => {
  const sessions = db.sessions.getAll();
  const session = sessions.find(s => s.id === req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (activeBrowsers.has(session.id)) {
    return res.status(400).json({ error: 'Session is already running' });
  }

  try {
    // Get fingerprint settings
    const fingerprints = db.fingerprints.getAll();
    const fingerprint = fingerprints.find(f => f.id === session.fingerprintId) || fingerprints[0];

    // Get proxy settings
    const proxies = db.proxies.getAll();
    const proxy = proxies.find(p => p.id === session.proxyId);

    // Browser launch options
    const launchOptions = {
      headless: false,
      userDataDir: path.join(PROFILES_DIR, session.id),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        `--window-size=${fingerprint?.viewport?.width || 1920},${fingerprint?.viewport?.height || 1080}`
      ],
      defaultViewport: fingerprint?.viewport || { width: 1920, height: 1080 }
    };

    // Add proxy if configured
    if (proxy) {
      const proxyUrl = proxy.type === 'socks5'
        ? `socks5://${proxy.host}:${proxy.port}`
        : `http://${proxy.host}:${proxy.port}`;
      launchOptions.args.push(`--proxy-server=${proxyUrl}`);
    }

    // Launch browser
    const browser = await puppeteer.launch(launchOptions);

    // Apply fingerprint settings to new pages
    browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        const page = await target.page();
        if (page && fingerprint) {
          await applyFingerprint(page, fingerprint);

          // Handle proxy authentication
          if (proxy && proxy.username && proxy.password) {
            await page.authenticate({
              username: proxy.username,
              password: proxy.password
            });
          }
        }
      }
    });

    // Apply to initial page
    const pages = await browser.pages();
    if (pages.length > 0 && fingerprint) {
      await applyFingerprint(pages[0], fingerprint);
      if (proxy && proxy.username && proxy.password) {
        await pages[0].authenticate({
          username: proxy.username,
          password: proxy.password
        });
      }
    }

    // Store browser instance
    activeBrowsers.set(session.id, browser);

    // Handle browser close
    browser.on('disconnected', () => {
      activeBrowsers.delete(session.id);
    });

    // Execute account task if the session has an account with a task configured
    const accounts = db.accounts.getAll();
    const account = session.accountId ? accounts.find(a => a.id === session.accountId) : null;

    let taskName = 'None';

    if (account && account.taskType && account.taskType !== 'none' && accountTasks[account.taskType]) {
      const pages = await browser.pages();
      const page = pages[0] || await browser.newPage();
      const taskConfig = accountTasks[account.taskType];
      taskName = taskConfig.name;

      console.log(`[ChromeBot] Executing account task: ${taskName}`);

      // Execute the task with a slight delay to ensure browser is ready
      setTimeout(async () => {
        try {
          // Pass both task params and account credentials
          const taskContext = {
            ...account.taskParams,
            accountEmail: account.email,
            accountPassword: account.password
          };
          await taskConfig.execute(page, taskContext);
        } catch (taskError) {
          console.error(`[ChromeBot] Task error: ${taskError.message}`);
        }
      }, 2000);
    }

    res.json({ success: true, message: `Session "${session.name}" launched with task: ${taskName}` });

  } catch (error) {
    console.error('Launch error:', error);
    res.status(500).json({ error: 'Failed to launch browser', details: error.message });
  }
});

// Stop browser session
router.post('/:id/stop', async (req, res) => {
  if (!activeBrowsers.has(req.params.id)) {
    return res.status(400).json({ error: 'Session is not running' });
  }

  try {
    const browser = activeBrowsers.get(req.params.id);
    await browser.close();
    activeBrowsers.delete(req.params.id);
    res.json({ success: true, message: 'Session stopped' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop session' });
  }
});

// Export router and activeBrowsers for cleanup
module.exports = { router, activeBrowsers };
