const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const admin = require('firebase-admin');

// Import routes
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const authRouter = require('./routes/auth');

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

// Passport.js
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/', authRouter); // Include your existing Google OAuth routes
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/api', adminRoutes);

// Root route
app.get('/', (req, res) => {
  // You can check login status here
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.render('index', { user: req.user });
  } else {
    res.render('index', { user: null });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
