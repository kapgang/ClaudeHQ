const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ideasPath = path.join(__dirname, '..', 'data', 'ideas.json');

// Get all ideas
router.get('/', (req, res) => {
  try {
    const ideas = JSON.parse(fs.readFileSync(ideasPath, 'utf8'));
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load ideas' });
  }
});

// Add a new idea
router.post('/', (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    const ideas = JSON.parse(fs.readFileSync(ideasPath, 'utf8'));
    const newIdea = {
      id: Date.now(),
      title,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'new',
      createdAt: new Date().toISOString()
    };
    ideas.ideas.push(newIdea);
    fs.writeFileSync(ideasPath, JSON.stringify(ideas, null, 2));
    res.json(newIdea);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save idea' });
  }
});

// Update idea status
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const ideas = JSON.parse(fs.readFileSync(ideasPath, 'utf8'));
    const ideaIndex = ideas.ideas.findIndex(i => i.id === parseInt(id));

    if (ideaIndex === -1) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    ideas.ideas[ideaIndex] = { ...ideas.ideas[ideaIndex], ...updates };
    fs.writeFileSync(ideasPath, JSON.stringify(ideas, null, 2));
    res.json(ideas.ideas[ideaIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

module.exports = router;
