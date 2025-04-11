const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TikTik API!' });
});

// API routes
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
