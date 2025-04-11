const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        posts.*, 
        post_sources.name AS name, 
        post_sources.imageuri AS imageuri
      FROM posts
      LEFT JOIN post_sources ON posts.source_id = post_sources.id
      ORDER BY posts.id ASC
    `);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No posts found' });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        posts.*, 
        post_sources.name AS name, 
        post_sources.imageuri AS imageuri
      FROM posts
      LEFT JOIN post_sources ON posts.source_id = post_sources.id
      WHERE posts.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  const { uri, facts, tags, caption, source_name, imageuri } = req.body;
  try {
    // 1. Check if the source exists
    const sourceResult = await pool.query(
      `SELECT id FROM post_sources WHERE name = $1`,
      [source_name]
    );
    let sourceId;
    if (sourceResult.rows.length > 0) {
      // Source exists
      sourceId = sourceResult.rows[0].id;
    } else {
      // Source doesn't exist, insert it
      const insertSource = await pool.query(
        `INSERT INTO post_sources (name, imageuri) VALUES ($1, $2) RETURNING id`,
        [source_name, imageuri]
      );
      sourceId = insertSource.rows[0].id;
    }
    // 2. Insert the post with the found or created source ID
    const result = await pool.query(
      `INSERT INTO posts (uri, facts, tags, caption, source_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [uri, facts, tags, caption, sourceId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update a post
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { caption, tags, facts, url } = req.body;

  const fields = [];
  const values = [];
  let index = 1;

  if (caption !== undefined) {
    fields.push(`caption= $${index++}`);
    values.push(caption);
  }
  if (tags !== undefined) {
    fields.push(`tags = $${index++}`);
    values.push(tags);
  }
  if (facts !== undefined) {
    fields.push(`facts = $${index++}`);
    values.push(facts);
  }
  if (url !== undefined) {
    fields.push(`url = $${index++}`);
    values.push(url);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(id); // last placeholder for WHERE clause

  try {
    const result = await pool.query(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post: ', err);
    res.status(500).json({ error: 'Internal server error' })
  }
});

module.exports = router; 