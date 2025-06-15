const express = require('express');
const router = express.Router();
// const pool = require('../db'); // DB disabled

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
  console.log('GET /api/posts - Returning enabled video data');
  const enabledVideos = VIDEOS
    .filter(video => video.enabled !== false)
    .map(video => {
      // Remove the enabled field before sending to client
      const { enabled, ...clientVideo } = video;
      return clientVideo;
    });
  res.status(200).json(enabledVideos);
});

// Get post by ID - Real video data (only if enabled)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`GET /api/posts/${id} - Returning real video data`);
  
  const post = VIDEOS.find(video => video.id === parseInt(id));
  
  if (post && post.enabled !== false) {
    // Remove the enabled field before sending to client
    const { enabled, ...clientPost } = post;
    res.status(200).json(clientPost);
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
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

// Toggle video enabled/disabled status
router.patch('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  console.log(`PATCH /api/posts/${id}/toggle - Toggling video status`);
  
  const videoIndex = VIDEOS.findIndex(video => video.id === parseInt(id));
  
  if (videoIndex === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }
  
  // Toggle the enabled status
  VIDEOS[videoIndex].enabled = !VIDEOS[videoIndex].enabled;
  
  res.status(200).json({
    id: parseInt(id),
    enabled: VIDEOS[videoIndex].enabled,
    message: `Video ${id} ${VIDEOS[videoIndex].enabled ? 'enabled' : 'disabled'} successfully`
  });
});

module.exports = router;
module.exports.VIDEOS = VIDEOS; 