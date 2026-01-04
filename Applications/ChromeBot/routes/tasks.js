const express = require('express');
const router = express.Router();
const { getAllAccountTasks, getAllStandaloneTasks } = require('../tasks');

// Get account task types (for configuring Google accounts)
router.get('/accounttasks', (req, res) => {
  res.json({ accountTasks: getAllAccountTasks() });
});

// Get standalone tasks (no account needed)
router.get('/standalonetasks', (req, res) => {
  res.json({ standaloneTasks: getAllStandaloneTasks() });
});

module.exports = router;
