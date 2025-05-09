const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');

// Import routes
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://tiktik-ee1a2.firebaseio.com' 
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Initialize app
const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TikTik API!' });
});

// API routes
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);

// Admin Panel routes
app.use('/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
