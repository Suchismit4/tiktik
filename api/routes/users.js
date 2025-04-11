const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single user by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { name, username } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (name, username)
       VALUES ($1, $2)
       RETURNING *`,
      [name, username]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
  res.status(201).json({ id: 3, name, username });
});

// Update a user
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username } = req.body;
  res.json({ id: parseInt(id), name, username });
});

// Delete a user
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user: ', err);
    res.status(500).json({ error: 'Internal server error' })
  }
});

module.exports = router; 