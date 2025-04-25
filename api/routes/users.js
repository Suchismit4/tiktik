const express = require('express');
const router = express.Router();
// const pool = require('../db'); // DB disabled

// Get all users - Placeholder
router.get('/', async (req, res) => {
  console.log('GET /api/users (DB Disabled)');
  // Placeholder response
  res.status(200).json([
    { id: 1, name: 'User One', username: 'user1' },
    { id: 2, name: 'User Two', username: 'user2' }
  ]);
});

// Get a single user by id - Placeholder
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/users/${id} (DB Disabled)`);
  // Placeholder response
  res.status(200).json({ id: parseInt(id), name: `User ${id}`, username: `user${id}` });
});

// Create a new user - Placeholder
router.post('/', async (req, res) => {
  const { name, username } = req.body;
  console.log('POST /api/users (DB Disabled)', req.body);
  // Placeholder response
  res.status(201).json({ id: Date.now(), name, username });
});

// Update a user - Placeholder
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username } = req.body;
  console.log(`PUT /api/users/${id} (DB Disabled)`, req.body);
  // Placeholder response
  res.json({ id: parseInt(id), name, username });
});

// Delete a user - Placeholder
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`DELETE /api/users/${id} (DB Disabled)`);
  // Placeholder response
  res.status(200).json({ message: `User ${id} placeholder deleted successfully` });
});

module.exports = router; 