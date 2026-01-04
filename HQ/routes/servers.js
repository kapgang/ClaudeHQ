const express = require('express');
const { projects, getProjectById } = require('../config/projects');
const { checkPort } = require('../services/portChecker');
const { startServer, stopServer } = require('../services/processManager');

const router = express.Router();

// Get all projects config
router.get('/projects', (req, res) => {
  res.json({ projects });
});

// Get status of all servers
router.get('/', async (req, res) => {
  const statuses = [];

  for (const project of projects) {
    const portStatus = await checkPort(project.port);
    statuses.push({
      id: project.id,
      name: project.name,
      description: project.description,
      port: project.port,
      running: portStatus.inUse,
      pid: portStatus.pid || null,
      icon: project.icon,
      color: project.color,
      url: `http://localhost:${project.port}`
    });
  }

  res.json({ servers: statuses });
});

// Start a server
router.post('/:id/start', async (req, res) => {
  const project = getProjectById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const result = await startServer(project);

  if (result.success) {
    res.json(result);
  } else {
    res.status(result.error === 'Project directory not found' ? 404 : 400).json(result);
  }
});

// Stop a server
router.post('/:id/stop', async (req, res) => {
  const project = getProjectById(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const result = await stopServer(project);

  if (result.success) {
    res.json(result);
  } else {
    res.status(result.error === 'Server is not running' ? 400 : 500).json(result);
  }
});

module.exports = router;
