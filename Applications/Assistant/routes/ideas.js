const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'ideas.json');

function readIdeas() {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { ideas: [] };
  }
}

function writeIdeas(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Get all ideas
router.get('/', (req, res) => {
  const data = readIdeas();
  res.json(data);
});

// Get single idea
router.get('/:id', (req, res) => {
  const data = readIdeas();
  const idea = data.ideas.find(i => i.id === parseInt(req.params.id));
  if (!idea) {
    return res.status(404).json({ error: 'Idea not found' });
  }
  res.json(idea);
});

// Create new idea
router.post('/', (req, res) => {
  const data = readIdeas();
  const { title, description, category, priority, details } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newId = data.ideas.length > 0
    ? Math.max(...data.ideas.map(i => i.id)) + 1
    : 1;

  const newIdea = {
    id: newId,
    title,
    description,
    category: category || 'general',
    priority: priority || 'medium',
    details: details || '',
    created: new Date().toISOString()
  };

  data.ideas.push(newIdea);
  writeIdeas(data);

  res.status(201).json(newIdea);
});

// Update idea
router.put('/:id', (req, res) => {
  const data = readIdeas();
  const index = data.ideas.findIndex(i => i.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Idea not found' });
  }

  const { title, description, category, priority, details } = req.body;

  data.ideas[index] = {
    ...data.ideas[index],
    title: title || data.ideas[index].title,
    description: description || data.ideas[index].description,
    category: category || data.ideas[index].category,
    priority: priority || data.ideas[index].priority,
    details: details !== undefined ? details : data.ideas[index].details,
    updated: new Date().toISOString()
  };

  writeIdeas(data);
  res.json(data.ideas[index]);
});

// Delete idea
router.delete('/:id', (req, res) => {
  const data = readIdeas();
  const index = data.ideas.findIndex(i => i.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'Idea not found' });
  }

  const deleted = data.ideas.splice(index, 1)[0];
  writeIdeas(data);

  res.json({ message: 'Idea deleted', idea: deleted });
});

module.exports = router;
