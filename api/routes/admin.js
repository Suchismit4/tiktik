const express = require('express');
const router = express.Router();
const db = require('../db'); // Import the PostgreSQL connection
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video_file') {
      cb(null, 'uploads/videos/')
    } else if (file.fieldname === 'thumbnail_file') {
      cb(null, 'uploads/thumbnails/')
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for video uploads
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video_file') {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video uploads!'), false);
    }
  } else if (file.fieldname === 'thumbnail_file') {
    // Accept image files for thumbnails
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails!'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  }
});

// ---- Group utilities and mock storage (until DB table exists) ----
// Normalize a comma-separated tags string into a canonical, order-insensitive string
function canonicalizeTags(tagsInput) {
  if (!tagsInput) return '';
  const tagsArray = Array.isArray(tagsInput)
    ? tagsInput
    : String(tagsInput).split(',');
  const uniqueSorted = [...new Set(tagsArray.map(t => t.trim().toLowerCase()).filter(Boolean))].sort();
  return uniqueSorted.join(',');
}

// In-memory mock groups used for rendering when DB is not implemented
const MOCK_GROUPS = [
  {
    id: 1,
    name: 'Control Group A',
    description: 'Baseline control group for A/B testing',
    status: 'active',
    type: 'control',
    member_count: 25,
    experiment_count: 3,
    created_at: '2024-01-15T10:30:00Z',
    tags: ['control', 'baseline', 'ab-test']
  },
  {
    id: 2,
    name: 'Treatment Group B',
    description: 'Experimental group with new features',
    status: 'active',
    type: 'treatment',
    member_count: 23,
    experiment_count: 3,
    created_at: '2024-01-15T10:35:00Z',
    tags: ['treatment', 'experimental', 'ab-test']
  },
  {
    id: 3,
    name: 'Demographic Group - Young Adults',
    description: 'Participants aged 18-29 for demographic studies',
    status: 'active',
    type: 'demographic',
    member_count: 18,
    experiment_count: 1,
    created_at: '2024-01-20T14:20:00Z',
    tags: ['demographic', 'young-adults', 'age-based']
  },
  {
    id: 4,
    name: 'Behavioral Group - High Engagement',
    description: 'Users with high engagement patterns',
    status: 'inactive',
    type: 'behavioral',
    member_count: 12,
    experiment_count: 0,
    created_at: '2024-01-25T09:15:00Z',
    tags: ['behavioral', 'high-engagement', 'power-users']
  }
];

function isDuplicateTagSetCanonical(canonicalTags, excludeId) {
  // Try DB first if available; fallback to MOCK_GROUPS
  // Note: groups table schema unknown; we assume a text column 'tags' storing comma-separated tags or text[]
  // We'll handle DB in route handlers to keep async context; this function checks MOCK_GROUPS only
  return MOCK_GROUPS.some(g => {
    if (excludeId && Number(g.id) === Number(excludeId)) return false;
    const otherCanonical = canonicalizeTags(g.tags);
    return otherCanonical === canonicalTags;
  });
}

// In-memory membership tracking until DB is available
// Maps groupId -> Set<userId>
const GROUP_MEMBERS = new Map();
// Maps userId -> groupId
const USER_TO_GROUP = new Map();

function ensureGroupSet(groupId) {
  const gid = Number(groupId);
  if (!GROUP_MEMBERS.has(gid)) GROUP_MEMBERS.set(gid, new Set());
  return GROUP_MEMBERS.get(gid);
}

function updateGroupMemberCounts() {
  for (const g of MOCK_GROUPS) {
    const set = GROUP_MEMBERS.get(Number(g.id));
    g.member_count = set ? set.size : g.member_count || 0;
  }
}

// GET /admin - Render the admin panel
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
                    TO_CHAR(exp.start_date, 'YYYY-MM-DD') as start_date, 
                    TO_CHAR(exp.end_date, 'YYYY-MM-DD') as end_date, 
                    adm.username as created_by_admin_username
             FROM experiments exp
             LEFT JOIN admins adm ON exp.created_by_admin_id = adm.admin_id
             ORDER BY exp.created_at DESC LIMIT 10` // Fetch recent 10 experiments
        );
        
        res.render('admin', { 
            title: 'Admin Panel',
            experiments: rows, // rows will be an array of experiment objects
            error: null
        });
    } catch (error) {
        console.error('Error fetching experiments for dashboard:', error);
        res.render('admin', { 
            title: 'Admin Panel',
            experiments: [],
            error: 'Could not fetch experiments from database.'
        });
    }
});

// POST /admin/schedule - Handle scheduling a new experiment
router.post('/schedule', async (req, res) => {
    const {
        experimentName,
        experimentType,
        description,
        participants, // This is 'Number of Participants' from the form
        surveyOptions, // This is 'Survey Options' from the form
        behaviorNotes, // This is 'Behavior Notes' from the form
        startDate,
        endDate,
        questions, // This will be an array of question objects
        variantAName, // From A/B Test conditional section
        variantBName  // From A/B Test conditional section
    } = req.body;

    // TODO: Replace with actual logged-in admin ID after implementing admin authentication
    const created_by_admin_id = 1; 
    const status = 'planning'; // Default status for new experiments

    // Consolidate extra details into config_details JSONB field
    const config_details = {
        numberOfParticipants: participants ? parseInt(participants) : null,
        surveyOptionsProvided: surveyOptions,
        behavioralNotes: behaviorNotes,
        surveyQuestions: [], // Initialize as an empty array
        variants: [] // Initialize for A/B tests
    };

    if (experimentType === 'A/B Test' && variantAName && variantBName) {
        config_details.variants = [
            { id: 'A', name: variantAName, description: 'Variant A' }, // Can add more properties later
            { id: 'B', name: variantBName, description: 'Variant B' }
        ];
    } else if (experimentType === 'A/B Test') {
        // Handle case where A/B test is selected but variant names might be missing (e.g. if JS disabled, or error)
        // For now, we can log a warning or set default variant names
        console.warn('A/B Test selected but variant names are missing. Storing empty variants.');
    }

    if (questions && Array.isArray(questions)) {
        config_details.surveyQuestions = questions.map(q => ({
            text: q.text,
            type: q.type,
            options: q.type === 'multiple_choice' && q.options ? q.options.split(',').map(opt => opt.trim()) : [],
            slider_min: q.type === 'slider' ? parseInt(q.slider_min) : null,
            slider_max: q.type === 'slider' ? parseInt(q.slider_max) : null,
            slider_step: q.type === 'slider' ? parseInt(q.slider_step) : null,
        })).filter(q => q.text); // Ensure question text is present
    }

    try {
        const queryText = `
            INSERT INTO experiments 
            (name, type, description, status, config_details, start_date, end_date, created_by_admin_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING experiment_id;
        `;
        
        // Handle potentially empty date strings by converting to null
        const SDate = startDate === '' ? null : startDate;
        const EDate = endDate === '' ? null : endDate;
        
        const values = [
            experimentName,
            experimentType,
            description,
            status,
            config_details,
            SDate, 
            EDate,
            created_by_admin_id
        ];

        const { rows } = await db.query(queryText, values);
        const newExperimentId = rows[0].experiment_id;

        console.log(`New experiment scheduled with ID: ${newExperimentId}`);
        res.redirect('/admin?message=ExperimentScheduled'); 

    } catch (error) {
        console.error('Error scheduling new experiment:', error);
        res.redirect('/admin?error=ExperimentScheduleFailed'); // Or render an error view
    }
});


// POST /admin/download/:id - Handle data download request
router.post('/download/:id', (req, res) => {
    const experimentId = req.params.id;
    console.log(`Received download request for experiment ID: ${experimentId}`);

    // Example CSV content
    const csvContent = `Participant,Score,Completed
John Doe,87%,Yes
Jane Smith,92%,Yes
Alex Johnson,78%,No`;

    // Set the HTTP headers to tell the browser "this is a CSV download"
    res.setHeader('Content-Disposition', `attachment; filename=experiment_${experimentId}_results.csv`);
    res.setHeader('Content-Type', 'text/csv');

    // Send the CSV string directly
    res.status(200).send(csvContent);
});


// GET /admin/results/:id - View experiment results
router.get('/results/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch experiment details
    const expQuery = `
      SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
             TO_CHAR(exp.start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, 
             TO_CHAR(exp.end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date, 
             TO_CHAR(exp.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             adm.username as created_by_admin_username,
             exp.description, exp.config_details
      FROM experiments exp
      LEFT JOIN admins adm ON exp.created_by_admin_id = adm.admin_id
      WHERE exp.experiment_id = $1;
    `;
    const experimentResult = await db.query(expQuery, [id]);

    if (experimentResult.rows.length === 0) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Experiment not found.'});
    }
    const experiment = experimentResult.rows[0];

    // Fetch participants assigned to this experiment
    const participantsQuery = `
      SELECT au.firebase_uid, au.user_id as app_user_id, epb.variant_assigned, 
             TO_CHAR(epb.assigned_at, 'YYYY-MM-DD HH24:MI:SS') as assigned_at,
             epb.status_in_experiment
      FROM experiment_participants_bridge epb
      JOIN app_users au ON epb.participant_user_id = au.user_id
      WHERE epb.experiment_id = $1
      ORDER BY epb.assigned_at DESC;
    `;
    const participantsResult = await db.query(participantsQuery, [id]);
    
    // For now, actual interaction data/results are not fetched, this is an MVP view
    res.render('results', { 
      title: `Results for ${experiment.name}`,
      experiment: experiment,
      participants: participantsResult.rows, // List of participants in the experiment
      error: null
    });

  } catch (error) {
    console.error(`Error fetching results for experiment ID ${id}:`, error);
    res.status(500).render('error', { title: 'Server Error', message: 'Could not fetch experiment results.'});
  }
});


// View all experiments
router.get('/experiments', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
              TO_CHAR(exp.start_date, 'YYYY-MM-DD') as start_date, 
              TO_CHAR(exp.end_date, 'YYYY-MM-DD') as end_date, 
              adm.username as created_by_admin_username,
              exp.description, exp.config_details
       FROM experiments exp
       LEFT JOIN admins adm ON exp.created_by_admin_id = adm.admin_id
       ORDER BY exp.status, exp.created_at DESC`
    );
    res.render('experiments', {
      title: 'All Experiments',
      experiments: rows,
      error: null
    });
  } catch (error) {
    console.error('Error fetching all experiments:', error);
    res.render('experiments', {
      title: 'All Experiments',
      experiments: [],
      error: 'Could not fetch experiments from database.'
    });
  }
});
  
// View participants
router.get('/participants', async (req, res) => {
  try {
    // const admin = require('firebase-admin'); // No longer fetching from Firebase
    // const listUsersResult = await admin.auth().listUsers(1000);
    // const participants = listUsersResult.users.map(userRecord => ({
    //   uid: userRecord.uid,
    //   email: userRecord.email || 'N/A',
    //   displayName: userRecord.displayName || 'N/A',
    //   photoURL: userRecord.photoURL,
    //   disabled: userRecord.disabled,
    //   creationTime: userRecord.metadata.creationTime,
    //   lastSignInTime: userRecord.metadata.lastSignInTime
    // }));

    const { rows } = await db.query('SELECT user_id, firebase_uid, created_at FROM app_users ORDER BY created_at DESC');
    const participants = rows.map(user => ({
      uid: user.firebase_uid, // For consistency with previous template usage, map firebase_uid to uid
      user_id_db: user.user_id, // Keep original db id if needed elsewhere
      email: 'N/A', // app_users table doesn't store email from Firebase Auth directly yet
      displayName: 'N/A', // app_users table doesn't store displayName yet
      creationTime: user.created_at,
      lastSignInTime: 'N/A', // Not available directly from app_users table
      disabled: false // Placeholder, Firebase disabled status not in app_users
    }));

    // Expose groups to the view for assignment dropdown
    updateGroupMemberCounts();
    res.render('participants', { 
      title: 'Manage Participants', 
      participants: participants,
      groups: MOCK_GROUPS,
      message: req.query.message,
      error: null 
    });
  } catch (error) {
    console.error('Error listing users from DB:', error);
    res.render('participants', { 
      title: 'Manage Participants', 
      participants: [], 
      error: 'Error fetching participants from database. Please check server logs.' 
    });
  }
});

// View settings (login/logout page)
router.get('/settings', (req, res) => {
    res.render('settings', { title: 'Settings' });
});

// POST /admin/experiments/:id/assign-participants - Auto-assign participants to an experiment
router.post('/experiments/:id/assign-participants', async (req, res) => {
  const { id: experimentId } = req.params;
  const numberOfUsersToAssign = 5; // MVP: Assign a fixed number

  try {
    // Fetch the experiment to potentially use variant info later (not used in this MVP assignment logic)
    const expResult = await db.query('SELECT experiment_id, type, config_details FROM experiments WHERE experiment_id = $1', [experimentId]);
    if (expResult.rows.length === 0) {
      return res.redirect(`/admin/results/${experimentId}?error=ExperimentNotFound`);
    }
    const experiment = expResult.rows[0]; 
    
    // Find users not already in this experiment (no double assigning)
    const availableUsersQuery = `
      SELECT user_id FROM app_users 
      WHERE user_id NOT IN (
        SELECT participant_user_id FROM experiment_participants_bridge WHERE experiment_id = $1
      )
      ORDER BY RANDOM() LIMIT $2;
    `;
    const { rows: availableUsers } = await db.query(availableUsersQuery, [experimentId, numberOfUsersToAssign]);

    if (availableUsers.length === 0) {
      return res.redirect(`/admin/results/${experimentId}?message=NoAvailableUsersToAssign`);
    }

    const client = await db.pool.connect(); // For transaction
    try {
      await client.query('BEGIN');
      
      // Get current participant counts for each variant in this experiment
      let variantCounts = {};
      if (experiment.type === 'A/B Test' && experiment.config_details && experiment.config_details.variants && experiment.config_details.variants.length > 0) {
        for (const variant of experiment.config_details.variants) {
          const countResult = await client.query(
            'SELECT COUNT(*) as count FROM experiment_participants_bridge WHERE experiment_id = $1 AND variant_assigned = $2',
            [experimentId, variant.name]
          );
          variantCounts[variant.name] = parseInt(countResult.rows[0].count);
        }
      }

      for (const user of availableUsers) {
        let variantAssigned = 'default'; // Default for non-A/B or if variants not set up

        if (experiment.type === 'A/B Test' && experiment.config_details && experiment.config_details.variants && experiment.config_details.variants.length > 0) {
            const variants = experiment.config_details.variants;
            // Simple strategy: assign to the variant with the fewest participants currently
            // If counts are equal, or only one variant (should not happen for A/B), pick the first
            let targetVariant = variants[0].name;
            if (variants.length > 1) {
                let minCount = variantCounts[variants[0].name];
                targetVariant = variants[0].name;

                for (let i = 1; i < variants.length; i++) {
                    if (variantCounts[variants[i].name] < minCount) {
                        minCount = variantCounts[variants[i].name];
                        targetVariant = variants[i].name;
                    }
                }
            }
            variantAssigned = targetVariant;
            variantCounts[variantAssigned]++; // Increment count for the next iteration in this batch
        }

        const insertQuery = `
          INSERT INTO experiment_participants_bridge 
          (experiment_id, participant_user_id, variant_assigned, status_in_experiment)
          VALUES ($1, $2, $3, $4) ON CONFLICT (experiment_id, participant_user_id) DO NOTHING;
        `;
        await client.query(insertQuery, [experimentId, user.user_id, variantAssigned, 'enrolled']);
      }
      await client.query('COMMIT');
      res.redirect(`/admin/results/${experimentId}?message=UsersAssigned`);
    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('Transaction Error assigning participants:', transactionError);
      res.redirect(`/admin/results/${experimentId}?error=AssignParticipantsFailed`);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error auto-assigning participants:', error);
    res.redirect(`/admin/results/${experimentId}?error=AssignParticipantsFailed`);
  }
});

// POST /admin/experiments/:id/drop-participants - Drop all participants from an experiment
router.post('/experiments/:id/drop-participants', async (req, res) => {
  const { id: experimentId } = req.params;
  try {
    await db.query('DELETE FROM experiment_participants_bridge WHERE experiment_id = $1', [experimentId]);
    res.redirect(`/admin/results/${experimentId}?message=ParticipantsDropped`);
  } catch (error) {
    console.error('Error dropping participants:', error);
    res.redirect(`/admin/results/${experimentId}?error=DropParticipantsFailed`);
  }
});

// POST /admin/experiments/:id/delete - Delete an experiment
router.post('/experiments/:id/delete', async (req, res) => {
  const { id: experimentId } = req.params;
  try {
    // The ON DELETE CASCADE constraints on experiment_participants_bridge (for experiment_id)
    // and interaction_data (for assignment_id) will handle deletion of related records.
    const deleteResult = await db.query('DELETE FROM experiments WHERE experiment_id = $1 RETURNING name', [experimentId]);

    if (deleteResult.rowCount > 0) {
        console.log(`Experiment "${deleteResult.rows[0].name}" (ID: ${experimentId}) and associated data deleted successfully.`);
        res.redirect('/admin/experiments?message=ExperimentDeleted');
    } else {
        console.warn(`Attempted to delete experiment ID: ${experimentId}, but it was not found.`);
        res.redirect('/admin/experiments?error=ExperimentNotFoundForDelete');
    }
  } catch (error) {
    console.error(`Error deleting experiment ID ${experimentId}:`, error);
    res.redirect(`/admin/experiments?error=ExperimentDeleteFailed&detail=${encodeURIComponent(error.message)}`);
  }
});

// GET /admin/content - View content management page
router.get('/content', async (req, res) => {
  try {
    // For now, we'll use the same video data from posts.js
    // In future, this would query the database content table
    const postsModule = require('./posts');
    const VIDEOS = postsModule.VIDEOS || []; // Import the video data
    
    // Calculate total unique tags
    const allTags = VIDEOS.flatMap(video => video.tags || []);
    const uniqueTags = [...new Set(allTags)];
    
    res.render('content', {
      title: 'Content Management',
      videos: VIDEOS.map(video => ({
        ...video,
        uploaded_at: new Date().toISOString(), // Mock upload date
        status: 'active' // Mock status
      })),
      totalTags: uniqueTags.length,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error loading content page:', error);
    res.render('content', {
      title: 'Content Management',
      videos: [],
      totalTags: 0,
      error: 'Could not load content data.'
    });
  }
});

// POST /admin/content/upload - Handle content upload with enhanced metadata
router.post('/content/upload', upload.fields([
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      video_url,
      title,
      caption,
      thumbnail_url,
      source_name,
      source_image,
      duration,
      tags,
      // Enhanced metadata fields
      content_category,
      content_genre,
      sentiment,
      complexity_level,
      target_audience,
      visual_style,
      emotional_tone,
      controversy_level,
      news_type,
      geographic_relevance,
      content_themes,
      production_quality,
      audio_characteristics,
      language,
      reading_level,
      engagement_prediction
    } = req.body;

    let finalVideoUrl = video_url;
    let finalThumbnailUrl = thumbnail_url;

    // Handle uploaded video file
    if (req.files && req.files.video_file) {
      const videoFile = req.files.video_file[0];
      finalVideoUrl = `/api/stream/video/${videoFile.filename}`;
      console.log('Video file uploaded:', videoFile.filename);
    }

    // Handle uploaded thumbnail file
    if (req.files && req.files.thumbnail_file) {
      const thumbnailFile = req.files.thumbnail_file[0];
      finalThumbnailUrl = `/api/stream/thumbnail/${thumbnailFile.filename}`;
      console.log('Thumbnail file uploaded:', thumbnailFile.filename);
    }

    // Validate that we have either URL or file upload
    if (!finalVideoUrl) {
      return res.redirect('/admin/content?error=Either video URL or video file is required');
    }

    // Parse tags and themes
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const themeArray = content_themes ? content_themes.split(',').map(theme => theme.trim()).filter(theme => theme) : [];
    const audioCharArray = audio_characteristics ? audio_characteristics.split(',').map(char => char.trim()).filter(char => char) : [];

    // Create enhanced content object with comprehensive metadata
    const newContent = {
      video_url: finalVideoUrl,
      title: title || null,
      description_caption: caption || null,
      thumbnail_url: finalThumbnailUrl || null,
      duration_seconds: duration ? parseInt(duration) : null,
      source: source_name ? {
        name: source_name,
        imageuri: source_image || null
      } : null,
      tags: tagArray,
      // Enhanced metadata for engagement analysis
      metadata: {
        content_category: content_category || null,
        content_genre: content_genre || null,
        sentiment: sentiment || null,
        complexity_level: complexity_level || null,
        target_audience: target_audience || null,
        visual_style: visual_style || null,
        emotional_tone: emotional_tone || null,
        controversy_level: controversy_level ? parseInt(controversy_level) : null,
        news_type: news_type || null,
        geographic_relevance: geographic_relevance || null,
        content_themes: themeArray,
        production_quality: production_quality || null,
        audio_characteristics: audioCharArray,
        language: language || 'en',
        reading_level: reading_level || null,
        engagement_prediction: engagement_prediction ? parseFloat(engagement_prediction) : null,
        upload_method: req.files && req.files.video_file ? 'file_upload' : 'url_provided',
        file_info: req.files && req.files.video_file ? {
          original_name: req.files.video_file[0].originalname,
          size: req.files.video_file[0].size,
          mimetype: req.files.video_file[0].mimetype
        } : null
      },
      uploaded_at: new Date().toISOString()
    };

    console.log('Enhanced content upload:', JSON.stringify(newContent, null, 2));

    // TODO: Save to database when content table is implemented
    // const result = await db.query(
    //   'INSERT INTO content (video_url, title, description_caption, thumbnail_url, duration_seconds, custom_metadata, uploaded_by_admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING content_id',
    //   [finalVideoUrl, title, caption, finalThumbnailUrl, duration, newContent.metadata, admin_id]
    // );

    // For now, add to the local VIDEOS array so it shows up in the content library
    const postsModule = require('./posts');
    const VIDEOS = postsModule.VIDEOS;
    
    // Generate a new ID (find the highest existing ID and add 1)
    const maxId = VIDEOS.length > 0 ? Math.max(...VIDEOS.map(v => v.id)) : 0;
    const newId = maxId + 1;
    
    // Create a post object that matches the expected format
    const newPost = {
      id: newId,
      uri: finalVideoUrl,
      caption: title || caption || 'Uploaded video',
      source: newContent.source || {
        name: 'Admin Upload',
        imageuri: 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: 0,
      facts: [],
      tags: tagArray,
      enabled: true, // New uploads are enabled by default
      // Store additional metadata for admin panel display
      metadata: newContent.metadata,
      title: title,
      thumbnail_url: finalThumbnailUrl,
      duration_seconds: newContent.duration_seconds,
      uploaded_at: newContent.uploaded_at
    };
    
    // Add to the beginning of the array so it appears first
    VIDEOS.unshift(newPost);
    
    console.log(`Added new video with ID ${newId} to VIDEOS array. Total videos: ${VIDEOS.length}`);

    res.redirect('/admin/content?message=Content uploaded successfully with enhanced metadata');
  } catch (error) {
    console.error('Error uploading content:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.redirect('/admin/content?error=File too large. Maximum size is 500MB.');
    } else if (error.message.includes('Only video files are allowed')) {
      res.redirect('/admin/content?error=Invalid file type. Only video files are allowed.');
    } else {
      res.redirect('/admin/content?error=Failed to upload content: ' + error.message);
    }
  }
});

// POST /admin/content/:id/delete - Delete content
router.post('/content/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    // TODO: Implement database deletion when content table is ready
    // const deleteResult = await db.query('DELETE FROM content WHERE content_id = $1 RETURNING title', [id]);
    
    // For now, remove from the local VIDEOS array
    const postsModule = require('./posts');
    const VIDEOS = postsModule.VIDEOS;
    
    const videoIndex = VIDEOS.findIndex(video => video.id === parseInt(id));
    
    if (videoIndex === -1) {
      return res.redirect('/admin/content?error=Video not found');
    }
    
    // Remove the video from the array
    const deletedVideo = VIDEOS.splice(videoIndex, 1)[0];
    
    console.log(`Content deletion completed for ID: ${id}. Video "${deletedVideo.title || deletedVideo.caption}" removed. Total videos: ${VIDEOS.length}`);
    res.redirect('/admin/content?message=Content deleted successfully');
  } catch (error) {
    console.error(`Error deleting content ID ${id}:`, error);
    res.redirect('/admin/content?error=Failed to delete content');
  }
});

// POST /admin/content/:id/toggle - Toggle content enabled/disabled status
router.post('/content/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    // Get the VIDEOS array from posts.js
    const postsModule = require('./posts');
    const VIDEOS = postsModule.VIDEOS;
    
    const videoIndex = VIDEOS.findIndex(video => video.id === parseInt(id));
    
    if (videoIndex === -1) {
      return res.redirect('/admin/content?error=Video not found');
    }
    
    // Toggle the enabled status
    VIDEOS[videoIndex].enabled = !VIDEOS[videoIndex].enabled;
    
    const status = VIDEOS[videoIndex].enabled ? 'enabled' : 'disabled';
    console.log(`Content ID ${id} ${status}`);
    
    res.redirect(`/admin/content?message=Content ${status} successfully`);
  } catch (error) {
    console.error(`Error toggling content ID ${id}:`, error);
    res.redirect('/admin/content?error=Failed to toggle content status');
  }
});

// GET /admin/stream/video/:filename - Stream video files
router.get('/stream/video/:filename', (req, res) => {
  const { filename } = req.params;
  const videoPath = path.join(__dirname, '../uploads/videos', filename);
  
  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Stream entire file
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// GET /admin/stream/thumbnail/:filename - Serve thumbnail images
router.get('/stream/thumbnail/:filename', (req, res) => {
  const { filename } = req.params;
  const thumbnailPath = path.join(__dirname, '../uploads/thumbnails', filename);
  
  // Check if file exists
  if (!fs.existsSync(thumbnailPath)) {
    return res.status(404).json({ error: 'Thumbnail not found' });
  }

  // Determine content type based on file extension
  const ext = path.extname(filename).toLowerCase();
  let contentType = 'image/jpeg'; // default
  if (ext === '.png') contentType = 'image/png';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.webp') contentType = 'image/webp';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  fs.createReadStream(thumbnailPath).pipe(res);
});

// GET /admin/groups - View groups management page
router.get('/groups', async (req, res) => {
  try {
    // Query groups with tag names joined
    // Handle cases where group_members or experiment_groups tables might not exist
    let groupsQuery = `
      SELECT 
        g.group_id,
        g.description,
        g.max_participants,
        g.tag_ids,
        g.status,
        COALESCE(array_agg(DISTINCT t.tag_name) FILTER (WHERE t.tag_id IS NOT NULL), ARRAY[]::TEXT[]) as tag_names
      FROM groups g
      LEFT JOIN unnest(COALESCE(g.tag_ids, ARRAY[]::INTEGER[])) AS tag_id ON true
      LEFT JOIN tags t ON t.tag_id = tag_id
      GROUP BY g.group_id, g.description, g.max_participants, g.tag_ids, g.status
      ORDER BY g.group_id DESC
    `;
    
    const { rows } = await db.query(groupsQuery);
    
    // Get member counts and experiment counts separately (handle missing tables gracefully)
    let memberCounts = {};
    let experimentCounts = {};
    
    try {
      const memberQuery = 'SELECT group_id, COUNT(*) as count FROM group_members GROUP BY group_id';
      const memberResult = await db.query(memberQuery);
      memberResult.rows.forEach(row => {
        memberCounts[row.group_id] = parseInt(row.count);
      });
    } catch (e) {
      // group_members table doesn't exist, use empty counts
      console.log('group_members table not found, using empty counts');
    }
    
    try {
      const expQuery = 'SELECT group_id, COUNT(*) as count FROM experiment_groups GROUP BY group_id';
      const expResult = await db.query(expQuery);
      expResult.rows.forEach(row => {
        experimentCounts[row.group_id] = parseInt(row.count);
      });
    } catch (e) {
      // experiment_groups table doesn't exist, use empty counts
      console.log('experiment_groups table not found, using empty counts');
    }
    
    // Transform data for view
    const groups = rows.map(row => ({
      id: row.group_id,
      description: row.description || '',
      max_participants: row.max_participants,
      tag_ids: row.tag_ids || [],
      tag_names: row.tag_names || [],
      status: row.status === 1 ? 'active' : 'inactive',
      member_count: memberCounts[row.group_id] || 0,
      experiment_count: experimentCounts[row.group_id] || 0
    }));
    
    // Also fetch all available tags for the form
    const tagsQuery = 'SELECT tag_id, tag_name, tag_category FROM tags ORDER BY tag_category, tag_name';
    const tagsResult = await db.query(tagsQuery);
    
    res.render('groups', {
      title: 'Group Management',
      groups: groups,
      availableTags: tagsResult.rows,
      message: req.query.message,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error loading groups page:', error);
    res.render('groups', {
      title: 'Group Management',
      groups: [],
      availableTags: [],
      error: 'Could not load groups data.'
    });
  }
});

// POST /admin/groups/create - Create a new group
router.post('/groups/create', async (req, res) => {
  try {
    const {
      description,
      status,
      max_participants,
      tag_ids
    } = req.body;

    // Convert status to 0/1
    const statusValue = status === 'active' || status === '1' ? 1 : 0;
    
    // Parse tag_ids - can be comma-separated string or array
    // Empty tag_ids is valid - groups can have no tags
    let tagIdsArray = [];
    if (tag_ids) {
      if (Array.isArray(tag_ids)) {
        tagIdsArray = tag_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      } else if (typeof tag_ids === 'string' && tag_ids.trim() !== '') {
        tagIdsArray = tag_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    // Validate tag set uniqueness (compare sorted tag_ids arrays)
    // Empty arrays are considered the same tag set, so only one group can have no tags
    const sortedTagIds = [...tagIdsArray].sort((a, b) => a - b);
    const { rows: existingGroups } = await db.query(
      'SELECT group_id, tag_ids FROM groups'
    );
    
    for (const row of existingGroups) {
      const existingTagIds = (row.tag_ids || []).sort((a, b) => a - b);
      if (existingTagIds.length === sortedTagIds.length &&
          existingTagIds.every((id, idx) => id === sortedTagIds[idx])) {
        return res.redirect('/admin/groups?error=Another group already has the exact same tag set');
      }
    }

    // Insert into database
    // Use NULL for empty tag arrays to be consistent with database schema
    const insertQuery = `
      INSERT INTO groups (description, max_participants, tag_ids, status)
      VALUES ($1, $2, $3, $4)
      RETURNING group_id
    `;
    const values = [
      description || null,
      max_participants ? parseInt(max_participants) : null,
      tagIdsArray.length > 0 ? tagIdsArray : null,
      statusValue
    ];
    
    const { rows } = await db.query(insertQuery, values);
    const newGroupId = rows[0].group_id;

    res.redirect('/admin/groups?message=Group created successfully');
  } catch (error) {
    console.error('Error creating group:', error);
    res.redirect('/admin/groups?error=Failed to create group: ' + error.message);
  }
});

// POST /admin/groups/:id/edit - Edit an existing group
router.post('/groups/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      status,
      max_participants,
      tag_ids
    } = req.body;

    // Convert status to 0/1
    const statusValue = status === 'active' || status === '1' ? 1 : 0;
    
    // Parse tag_ids
    // Empty tag_ids is valid - groups can have no tags
    let tagIdsArray = [];
    if (tag_ids) {
      if (Array.isArray(tag_ids)) {
        tagIdsArray = tag_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      } else if (typeof tag_ids === 'string' && tag_ids.trim() !== '') {
        tagIdsArray = tag_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      }
    }

    // Validate tag set uniqueness (excluding current group)
    // Empty arrays are considered the same tag set, so only one group can have no tags
    const sortedTagIds = [...tagIdsArray].sort((a, b) => a - b);
    const { rows: existingGroups } = await db.query(
      'SELECT group_id, tag_ids FROM groups WHERE group_id <> $1',
      [id]
    );
    
    for (const row of existingGroups) {
      const existingTagIds = (row.tag_ids || []).sort((a, b) => a - b);
      if (existingTagIds.length === sortedTagIds.length &&
          existingTagIds.every((id, idx) => id === sortedTagIds[idx])) {
        return res.redirect('/admin/groups?error=Another group already has the exact same tag set');
      }
    }

    // Update in database
    // Use NULL for empty tag arrays to be consistent with database schema
    const updateQuery = `
      UPDATE groups 
      SET description = $1, max_participants = $2, tag_ids = $3, status = $4
      WHERE group_id = $5
      RETURNING group_id
    `;
    const values = [
      description || null,
      max_participants ? parseInt(max_participants) : null,
      tagIdsArray.length > 0 ? tagIdsArray : null,
      statusValue,
      id
    ];
    
    const { rows } = await db.query(updateQuery, values);
    
    if (rows.length === 0) {
      return res.redirect('/admin/groups?error=Group not found');
    }

    res.redirect('/admin/groups?message=Group updated successfully');
  } catch (error) {
    console.error(`Error updating group ${req.params.id}:`, error);
    res.redirect('/admin/groups?error=Failed to update group: ' + error.message);
  }
});

// POST /admin/groups/:id/delete - Delete a group
router.post('/groups/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `
      DELETE FROM groups 
      WHERE group_id = $1
      RETURNING group_id
    `;
    const { rows } = await db.query(deleteQuery, [id]);

    if (rows.length === 0) {
      return res.redirect('/admin/groups?error=Group not found');
    }

    console.log(`Group ${id} deleted`);

    res.redirect('/admin/groups?message=Group deleted successfully');
  } catch (error) {
    console.error(`Error deleting group ${req.params.id}:`, error);
    res.redirect('/admin/groups?error=Failed to delete group: ' + error.message);
  }
});

// GET /admin/groups/:id - Get single group for editing
router.get('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const groupQuery = `
      SELECT 
        g.group_id,
        g.description,
        g.max_participants,
        g.tag_ids,
        g.status,
        COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_id IS NOT NULL), ARRAY[]::TEXT[]) as tag_names
      FROM groups g
      LEFT JOIN unnest(g.tag_ids) AS tag_id ON true
      LEFT JOIN tags t ON t.tag_id = tag_id
      WHERE g.group_id = $1
      GROUP BY g.group_id, g.description, g.max_participants, g.tag_ids, g.status
    `;
    
    const { rows } = await db.query(groupQuery, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const group = {
      id: rows[0].group_id,
      description: rows[0].description || '',
      max_participants: rows[0].max_participants,
      tag_ids: rows[0].tag_ids || [],
      tag_names: rows[0].tag_names || [],
      status: rows[0].status === 1 ? 'active' : 'inactive'
    };
    
    res.json(group);
  } catch (error) {
    console.error(`Error fetching group ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// GET /admin/groups/:id/members - View group members
router.get('/groups/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement when group members table is ready
    // const queryText = `
    //   SELECT au.user_id, au.firebase_uid, gm.joined_at, gm.status
    //   FROM group_members gm
    //   JOIN app_users au ON gm.user_id = au.user_id
    //   WHERE gm.group_id = $1
    //   ORDER BY gm.joined_at DESC;
    // `;
    // const { rows } = await db.query(queryText, [id]);

    res.json({
      group_id: id,
      members: [], // rows
      message: 'Group members endpoint - to be implemented'
    });
  } catch (error) {
    console.error(`Error fetching group ${id} members:`, error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

// POST /admin/groups/:id/add-member - Add member to group
router.post('/groups/:id/add-member', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    // TODO: Implement when group members table is ready
    // const queryText = `
    //   INSERT INTO group_members (group_id, user_id, joined_at, status)
    //   VALUES ($1, $2, NOW(), 'active')
    //   ON CONFLICT (group_id, user_id) DO NOTHING
    //   RETURNING group_id, user_id;
    // `;
    // const { rows } = await db.query(queryText, [id, user_id]);

    console.log(`User ${user_id} added to group ${id}`);

    res.redirect(`/admin/groups/${id}/members?message=Member added successfully`);
  } catch (error) {
    console.error(`Error adding member to group ${id}:`, error);
    res.redirect(`/admin/groups/${id}/members?error=Failed to add member`);
  }
});

// POST /admin/groups/:id/remove-member - Remove member from group
router.post('/groups/:id/remove-member', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    // TODO: Implement when group members table is ready
    // const queryText = `
    //   DELETE FROM group_members 
    //   WHERE group_id = $1 AND user_id = $2
    //   RETURNING group_id, user_id;
    // `;
    // const { rows } = await db.query(queryText, [id, user_id]);

    console.log(`User ${user_id} removed from group ${id}`);

    res.redirect(`/admin/groups/${id}/members?message=Member removed successfully`);
  } catch (error) {
    console.error(`Error removing member from group ${id}:`, error);
    res.redirect(`/admin/groups/${id}/members?error=Failed to remove member`);
  }
});

// POST /admin/groups/bulk-add-members - Bulk add selected users to a group
router.post('/groups/bulk-add-members', async (req, res) => {
  try {
    const { group_id } = req.body;
    let { selected_user_ids } = req.body;

    if (!group_id) {
      return res.redirect('/admin/participants?error=Missing group selection');
    }

    if (!selected_user_ids) {
      return res.redirect('/admin/participants?error=No participants selected');
    }

    if (!Array.isArray(selected_user_ids)) {
      selected_user_ids = [selected_user_ids];
    }

    const targetGroupId = Number(group_id);
    const targetSet = ensureGroupSet(targetGroupId);

    // Enforce single-group rule by reassigning: remove from old group if present, then add to target
    for (const userIdRaw of selected_user_ids) {
      const userId = Number(userIdRaw);
      const existingGroupId = USER_TO_GROUP.get(userId);
      if (existingGroupId && existingGroupId !== targetGroupId) {
        const oldSet = ensureGroupSet(existingGroupId);
        oldSet.delete(userId);
      }
      // Assign to target
      targetSet.add(userId);
      USER_TO_GROUP.set(userId, targetGroupId);
    }

    updateGroupMemberCounts();

    return res.redirect('/admin/participants?message=Participants assigned to group');
  } catch (error) {
    console.error('Error bulk-adding members to group:', error);
    return res.redirect('/admin/participants?error=Failed to assign participants');
  }
});

module.exports = router;