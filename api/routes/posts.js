const express = require('express');
const router = express.Router();
// const pool = require('../db'); // DB disabled

// Get all posts - Placeholder
router.get('/', async (req, res) => {
  console.log('GET /api/posts (DB Disabled)');
  // Placeholder response
  res.status(200).json([
    { id: 1, uri: 'placeholder1', facts: ['fact1'], tags: ['tag1'], caption: 'Placeholder Post 1', source_id: 1, name: 'Source A', imageuri: 'imgA.jpg' },
    { id: 2, uri: 'placeholder2', facts: ['fact2'], tags: ['tag2'], caption: 'Placeholder Post 2', source_id: 2, name: 'Source B', imageuri: 'imgB.jpg' }
  ]);
});

// Get post by ID - Placeholder
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/posts/${id} (DB Disabled)`);
  // Placeholder response
  res.status(200).json(
    { id: parseInt(id), uri: `placeholder${id}`, facts: [`fact${id}`], tags: [`tag${id}`], caption: `Placeholder Post ${id}`, source_id: 1, name: 'Source A', imageuri: 'imgA.jpg' }
  );
});

// Create a new post - Placeholder
router.post('/', async (req, res) => {
  const { uri, facts, tags, caption, source_name, imageuri } = req.body;
  console.log('POST /api/posts (DB Disabled)', req.body);
  // Placeholder response
  res.status(201).json({
    id: Date.now(), // Fake ID
    uri,
    facts,
    tags,
    caption,
    source_id: Date.now() + 1, // Fake source ID
    name: source_name,
    imageuri
  });
});


// Update a post - Placeholder
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`PATCH /api/posts/${id} (DB Disabled)`, req.body);
  // Placeholder response
  res.json({ id: parseInt(id), ...req.body });
});

// Delete a post - Placeholder
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/posts/${id} (DB Disabled)`);
  // Placeholder response
  res.status(200).json({ message: `Post ${id} placeholder deleted successfully` });
});

module.exports = router; 