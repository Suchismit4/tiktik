var express = require('express');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc').Strategy;
var fs = require('fs');
var path = require('path');
var adminDb = require('../db'); // PostgreSQL pool (see your previous db.js)
var admin = require('firebase-admin');
var router = express.Router();

// Load allowed admin emails from admin.json
let ALLOWED_ADMIN_EMAILS = [];
try {
  const adminConfigPath = path.join(__dirname, '..', 'admin.json');
  const raw = fs.readFileSync(adminConfigPath, 'utf8');
  const parsed = JSON.parse(raw);
  ALLOWED_ADMIN_EMAILS = (parsed.admin || []).map(a => String(a.Email || '').toLowerCase()).filter(Boolean);
} catch (e) {
  console.warn('Could not load admin.json; all logins will be denied until configured.', e.message);
}

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile', 'email' ]
}, async function verify(issuer, profile, cb) {
  try {
    const firebaseUid = profile.id;
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) ? String(profile.emails[0].value).toLowerCase() : null;
    const displayName = profile.displayName || (email ? email.split('@')[0] : 'User');

    if (!email) {
      return cb(null, false, { message: 'Email not provided by Google' });
    }

    // Enforce admin whitelist by email
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      return cb(null, false, { message: 'NotAdmin' });
    }

    // Optional: verify Firebase token if needed
    // const decoded = await admins.auth().verifyIdToken(firebaseToken);

    // Check if admin exists in PostgreSQL (prefer match by email if column exists)
    let user = null;
    try {
      const emailResult = await adminDb.query('SELECT * FROM admins WHERE email = $1', [email]);
      if (emailResult.rows.length > 0) {
        user = emailResult.rows[0];
      }
    } catch (e) {
      // Possibly no email column; fallback to firebase_uid lookup
    }

    if (!user) {
      const uidResult = await adminDb.query('SELECT * FROM admins WHERE firebase_uid = $1', [firebaseUid]);
      if (uidResult.rows.length > 0) {
        user = uidResult.rows[0];
      }
    }

    if (!user) {
      // Insert admin — prefer including email if column exists
      try {
        const insertWithEmail = `
          INSERT INTO admins (username, email, firebase_uid, created_at)
          VALUES ($1, $2, $3, NOW())
          RETURNING admin_id, username, email, firebase_uid
        `;
        const insertRes = await adminDb.query(insertWithEmail, [displayName, email, firebaseUid]);
        user = insertRes.rows[0];
      } catch (e) {
        // Fallback if email column doesn't exist
        const insertFallback = `
          INSERT INTO admins (username, firebase_uid, created_at)
          VALUES ($1, $2, NOW())
          RETURNING admin_id, username, firebase_uid
        `;
        const insertRes = await adminDb.query(insertFallback, [displayName, firebaseUid]);
        user = insertRes.rows[0];
      }
    }

    return cb(null, user);
  } catch (err) {
    console.error('Error in Passport verify:', err);
    return cb(err);
  }
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(() => cb(null, { id: user.admin_id, username: user.username, firebase_uid: user.firebase_uid }));
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(() => cb(null, user));
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Render no-admin access page
router.get('/no-admin', (req, res) => {
  res.status(403).render('noadmin', { title: 'Access Denied' });
});

// Start Google OAuth flow
router.get('/login/federated/google', passport.authenticate('google'));

// OAuth callback route
router.get('/oauth2/redirect/google',
  passport.authenticate('google', {
    successRedirect: '/admin',
    failureRedirect: '/no-admin'
  })
);

// Logout
router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;