const express = require('express');
const systemRoutes = require('./system');
const serverRoutes = require('./servers');
const logRoutes = require('./logs');

const router = express.Router();

router.use('/system', systemRoutes);
router.use('/servers', serverRoutes);
router.use('/projects', (req, res) => {
  const { projects } = require('../config/projects');
  res.json({ projects });
});
router.use('/logs', logRoutes);

module.exports = router;
