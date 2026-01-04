const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../utils/data');

// Get all accounts
router.get('/', (req, res) => {
  const accounts = db.accounts.getAll();
  // Don't send passwords in response
  const safe = accounts.map(({ password, ...rest }) => rest);
  res.json({ accounts: safe });
});

// Add new account
router.post('/', (req, res) => {
  const { email, password, name, taskType, taskParams } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const accounts = db.accounts.getAll();
  const account = {
    id: uuidv4(),
    email,
    password: password || '',
    name: name || email.split('@')[0],
    taskType: taskType || 'none',
    taskParams: taskParams || {},
    createdAt: new Date().toISOString()
  };

  accounts.push(account);
  db.accounts.save(accounts);

  const { password: _, ...safe } = account;
  res.json({ success: true, account: safe });
});

// Update account
router.put('/:id', (req, res) => {
  const { email, password, name, taskType, taskParams } = req.body;
  const accounts = db.accounts.getAll();
  const index = accounts.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  accounts[index] = {
    ...accounts[index],
    email: email || accounts[index].email,
    password: password !== undefined ? password : accounts[index].password,
    name: name || accounts[index].name,
    taskType: taskType !== undefined ? taskType : accounts[index].taskType,
    taskParams: taskParams !== undefined ? taskParams : accounts[index].taskParams
  };

  db.accounts.save(accounts);
  const { password: _, ...safe } = accounts[index];
  res.json({ success: true, account: safe });
});

// Delete account
router.delete('/:id', (req, res) => {
  const accounts = db.accounts.getAll();
  const index = accounts.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }

  accounts.splice(index, 1);
  db.accounts.save(accounts);
  res.json({ success: true });
});

module.exports = router;
