const express = require('express');
const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', username: 'johndoe' },
    { id: 2, name: 'Jane Smith', username: 'janesmith' }
  ]);
});

// Get a single user by id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ id: parseInt(id), name: `User ${id}`, username: `user${id}` });
});

// Create a new user
router.post('/', (req, res) => {
  const { name, username } = req.body;
  res.status(201).json({ id: 3, name, username });
});

// Update a user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, username } = req.body;
  res.json({ id: parseInt(id), name, username });
});

// Delete a user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `User ${id} deleted successfully` });
});

module.exports = router; 