const express = require('express');
const router = express.Router();
const db = require('../db');

// Sample video data matching the app's constants
const VIDEOS = [
  { 
    id: 1, 
    uri: 'https://drive.google.com/uc?export=download&id=1567uKxxJx9J5uvf0BbLU-Qipe0YZZl39',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 3800,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 2, 
    uri: 'https://drive.google.com/uc?export=download&id=17QAoPwiSeQjm-v8uO3gp7BymemHCzh_T',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 2500,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 3, 
    uri: 'https://drive.google.com/uc?export=download&id=19YlJ9AcQJxlocoe3puA5aHriaKtvufB8',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 1900,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 4, 
    uri: 'https://drive.google.com/uc?export=download&id=1ZiEPJPjTlYUnOabU7UjnoFtrbT6JNKaJ',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 4200,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 5, 
    uri: 'https://drive.google.com/uc?export=download&id=1h2Ns1ZKui5XPB8c1sUxHMPKB7ElVB5sW',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 3100,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 6, 
    uri: 'https://drive.google.com/uc?export=download&id=1jrZaKS8ZkycMCCW9wdcLQuJTuh4p8WS0',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 2800,
    facts: [],
    tags: [],
    enabled: true
  },
  { 
    id: 7, 
    uri: 'https://drive.google.com/uc?export=download&id=1pqHpIZuIR3rCDhdYJkDB6BOYEcwV7ejG',
    caption: 'A short caption similar to explanatory headline.',
    source: {
      name: 'USA Today',
      imageuri: 'https://i.imgur.com/P8OOZMm.png'
    },
    likes: 3500,
    facts: [],
    tags: [],
    enabled: true
  },
];

// Get all posts - Real video data (only enabled videos)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/posts - Fetching from PostgreSQL');
    
    const query = `
      SELECT 
        c.content_id as id,
        c.video_url as uri,
        c.description_caption as caption,
        c.custom_metadata->'source'->>'name' as source_name,
        c.custom_metadata->'source'->>'imageuri' as source_imageuri,
        COALESCE(c.custom_metadata->>'likes', '0')::integer as likes,
        COALESCE(c.custom_metadata->'facts', '[]'::json) as facts,
        COALESCE(c.custom_metadata->'tags', '[]'::json) as tags,
        COALESCE(c.custom_metadata->>'enabled', 'true')::boolean as enabled
      FROM content c
      WHERE COALESCE(c.custom_metadata->>'enabled', 'true')::boolean = true
      ORDER BY c.content_id
    `;
    
    const result = await db.query(query);
    
    const posts = result.rows.map(row => ({
      id: row.id,
      uri: row.uri,
      caption: row.caption,
      source: {
        name: row.source_name || 'Unknown Source',
        imageuri: row.source_imageuri || 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: row.likes || 0,
      facts: row.facts || [],
      tags: row.tags || []
    }));
    
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get post by ID - Real video data (only if enabled)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /api/posts/${id} - Fetching from PostgreSQL`);
    
    const query = `
      SELECT 
        c.content_id as id,
        c.video_url as uri,
        c.description_caption as caption,
        c.custom_metadata->'source'->>'name' as source_name,
        c.custom_metadata->'source'->>'imageuri' as source_imageuri,
        COALESCE(c.custom_metadata->>'likes', '0')::integer as likes,
        COALESCE(c.custom_metadata->'facts', '[]'::json) as facts,
        COALESCE(c.custom_metadata->'tags', '[]'::json) as tags,
        COALESCE(c.custom_metadata->>'enabled', 'true')::boolean as enabled
      FROM content c
      WHERE c.content_id = $1 AND COALESCE(c.custom_metadata->>'enabled', 'true')::boolean = true
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const row = result.rows[0];
    const post = {
      id: row.id,
      uri: row.uri,
      caption: row.caption,
      source: {
        name: row.source_name || 'Unknown Source',
        imageuri: row.source_imageuri || 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: row.likes || 0,
      facts: row.facts || [],
      tags: row.tags || []
    };
    
    res.status(200).json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post
router.post('/', async (req, res) => {
  try {
    const { uri, facts, tags, caption, source_name, imageuri } = req.body;
    console.log('POST /api/posts - Creating new post in PostgreSQL', req.body);
    
    // Prepare custom metadata
    const customMetadata = {
      source: {
        name: source_name || 'Unknown Source',
        imageuri: imageuri || 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: 0,
      facts: facts || [],
      tags: tags || [],
      enabled: true
    };
    
    const query = `
      INSERT INTO content (video_url, description_caption, custom_metadata)
      VALUES ($1, $2, $3)
      RETURNING content_id, video_url, description_caption, custom_metadata
    `;
    
    const result = await db.query(query, [uri, caption, JSON.stringify(customMetadata)]);
    const newPost = result.rows[0];
    
    res.status(201).json({
      id: newPost.content_id,
      uri: newPost.video_url,
      facts: customMetadata.facts,
      tags: customMetadata.tags,
      caption: newPost.description_caption,
      source: customMetadata.source
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Update a post
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uri, facts, tags, caption, source_name, imageuri, likes } = req.body;
    console.log(`PATCH /api/posts/${id} - Updating post in PostgreSQL`, req.body);
    
    // First, get the current post to merge metadata
    const getQuery = 'SELECT custom_metadata FROM content WHERE content_id = $1';
    const getResult = await db.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const currentMetadata = getResult.rows[0].custom_metadata || {};
    
    // Update metadata with new values
    const updatedMetadata = {
      ...currentMetadata,
      source: {
        name: source_name || currentMetadata.source?.name || 'Unknown Source',
        imageuri: imageuri || currentMetadata.source?.imageuri || 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: likes !== undefined ? likes : currentMetadata.likes || 0,
      facts: facts || currentMetadata.facts || [],
      tags: tags || currentMetadata.tags || [],
      enabled: currentMetadata.enabled !== undefined ? currentMetadata.enabled : true
    };
    
    const updateQuery = `
      UPDATE content 
      SET 
        video_url = COALESCE($2, video_url),
        description_caption = COALESCE($3, description_caption),
        custom_metadata = $4
      WHERE content_id = $1
      RETURNING content_id, video_url, description_caption, custom_metadata
    `;
    
    const result = await db.query(updateQuery, [
      id, 
      uri, 
      caption, 
      JSON.stringify(updatedMetadata)
    ]);
    
    const updatedPost = result.rows[0];
    
    res.json({
      id: updatedPost.content_id,
      uri: updatedPost.video_url,
      caption: updatedPost.description_caption,
      source: updatedMetadata.source,
      likes: updatedMetadata.likes,
      facts: updatedMetadata.facts,
      tags: updatedMetadata.tags
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/posts/${id} - Deleting post from PostgreSQL`);
    
    const query = 'DELETE FROM content WHERE content_id = $1 RETURNING content_id';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.status(200).json({ 
      message: `Post ${id} deleted successfully`,
      deleted_id: result.rows[0].content_id
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle video enabled/disabled status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`PATCH /api/posts/${id}/toggle - Toggling video status in PostgreSQL`);
    
    // First, get the current post and its metadata
    const getQuery = 'SELECT custom_metadata FROM content WHERE content_id = $1';
    const getResult = await db.query(getQuery, [id]);
    
    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const currentMetadata = getResult.rows[0].custom_metadata || {};
    const currentEnabled = currentMetadata.enabled !== undefined ? currentMetadata.enabled : true;
    const newEnabled = !currentEnabled;
    
    // Update the enabled status in metadata
    const updatedMetadata = {
      ...currentMetadata,
      enabled: newEnabled
    };
    
    const updateQuery = `
      UPDATE content 
      SET custom_metadata = $2
      WHERE content_id = $1
      RETURNING content_id
    `;
    
    const result = await db.query(updateQuery, [id, JSON.stringify(updatedMetadata)]);
    
    res.status(200).json({
      id: parseInt(id),
      enabled: newEnabled,
      message: `Video ${id} ${newEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling video status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
module.exports.VIDEOS = VIDEOS; 