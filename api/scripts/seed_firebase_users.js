const admin = require('firebase-admin');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' }); // Adjust path if your .env is elsewhere relative to this script

// Initialize Firebase Admin SDK
try {
  const serviceAccount = require('../serviceAccountKey.json'); // Adjust path
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://' + serviceAccount.project_id + '.firebaseio.com'
  });
  console.log('Firebase Admin SDK initialized for seeding.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK for seeding:', error);
  process.exit(1);
}

const creds = { 
  DB_USER: "postgres",
  DB_HOST: "localhost",
  DB_DATABASE: "newsnow",
  DB_PASSWORD: "YarosLab",
  DB_PORT: "5432",
  SERVER_PORT: "3000"
}

// PostgreSQL Pool
const pool = new Pool({
  user: creds.DB_USER,
  host: creds.DB_HOST,
  database: creds.DB_DATABASE,
  password: creds.DB_PASSWORD,
  port: parseInt(creds.DB_PORT || '5432'),
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL for seeding.');
});
pool.on('error', (err) => {
  console.error('PostgreSQL pool error during seeding:', err);
  process.exit(-1);
});

async function seedUsers() {
  let seededCount = 0;
  let skippedCount = 0;
  let pageToken;

  console.log('Starting to fetch users from Firebase Auth...');

  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      console.log(`Fetched ${listUsersResult.users.length} users from Firebase.`);

      if (listUsersResult.users.length === 0) {
        console.log('No users found in Firebase Auth to seed.');
        break;
      }

      for (const userRecord of listUsersResult.users) {
        const firebaseUid = userRecord.uid;
        try {
          // Check if user already exists
          const { rows } = await pool.query('SELECT 1 FROM app_users WHERE firebase_uid = $1', [firebaseUid]);
          if (rows.length > 0) {
            // console.log(`User ${firebaseUid} already exists in PostgreSQL. Skipping.`);
            skippedCount++;
          } else {
            // Insert user
            await pool.query('INSERT INTO app_users (firebase_uid, created_at) VALUES ($1, $2)', [firebaseUid, new Date()]);
            console.log(`Seeded user ${firebaseUid} into PostgreSQL.`);
            seededCount++;
          }
        } catch (dbError) {
          console.error(`Error processing user ${firebaseUid}:`, dbError.message);
          console.log(process.env.DB_PASSWORD)
        }
      }
      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    console.log('\n--- Seeding Complete ---');
    console.log(`Successfully seeded ${seededCount} new users.`);
    console.log(`Skipped ${skippedCount} existing users.`);

  } catch (error) {
    console.error('Error listing or seeding users:', error);
  } finally {
    await pool.end();
    console.log('PostgreSQL pool closed.');
    // Firebase admin does not need to be explicitly closed for this script type
  }
}

seedUsers(); 