const express = require('express');
const router = express.Router();

// Get all posts
router.get('/', (req, res) => {
  res.json([
    { id: 1, title: 'First post', content: 'This is the first post content' },
    { id: 2, title: 'Second post', content: 'This is the second post content' }
  ]);
});

// Get a single post by id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id: parseInt(id), title: `Post ${id}`, content: `This is post ${id} content` });
});

// Create a new post
router.post('/', (req, res) => {
  const { title, content } = req.body;
  res.status(201).json({ id: 3, title, content });
});

// Update a post
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  res.json({ id: parseInt(id), title, content });
});

// Delete a post
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Post ${id} deleted successfully` });
});

module.exports = router; 