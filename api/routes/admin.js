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

// Helpers for tag management
async function fetchTagsWithUsage() {
  const query = `
    SELECT 
      t.tag_id,
      t.tag_name,
      t.tag_category,
      t.description,
      t.created_at,
      COUNT(c.content_id) FILTER (WHERE t.tag_id = ANY(c.tag_ids)) AS usage_count
    FROM tags t
    LEFT JOIN content c ON t.tag_id = ANY(c.tag_ids)
    GROUP BY t.tag_id
    ORDER BY t.created_at DESC
  `;
  const { rows } = await db.query(query);
  return rows;
}

async function fetchContentForTag(tagId) {
  const query = `
    SELECT 
      content_id,
      video_url,
      description_caption,
      thumbnail_url,
      duration_seconds,
      custom_metadata,
      tag_ids,
      uploaded_at
    FROM content
    WHERE $1 = ANY(tag_ids)
    ORDER BY content_id DESC
  `;
  const { rows } = await db.query(query, [tagId]);
  return rows.map(row => ({
    id: row.content_id,
    video_url: row.video_url,
    caption: row.description_caption,
    thumbnail: row.thumbnail_url || row.custom_metadata?.thumbnail_url || null,
    duration_seconds: row.duration_seconds,
    uploaded_at: row.uploaded_at,
    tags: row.tag_ids || []
  }));
}

// -------------------------
// Experiment helpers
// -------------------------
async function expireExperimentsIfNeeded() {
  try {
    // Auto-activate planning experiments that have reached start time (or no start_date).
    await db.query(`
      UPDATE experiments
      SET status = 'active'
      WHERE status = 'planning'
        AND NOW() >= COALESCE(start_date, created_at)
    `);

    // Expire active experiments by TTL (measured from start_date if present, else created_at) or end_date.
    await db.query(`
      UPDATE experiments
      SET status = 'completed'
      WHERE status = 'active'
        AND (
          (ttl_seconds IS NOT NULL AND ttl_seconds > 0 AND NOW() >= COALESCE(start_date, created_at) + ttl_seconds * INTERVAL '1 second')
          OR (end_date IS NOT NULL AND end_date <= NOW())
        )
    `);
  } catch (e) {
    console.warn('expireExperimentsIfNeeded skipped:', e.message);
  }
}

function computeExperimentView(row) {
  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const startDate = row.start_date ? new Date(row.start_date) : null;
  const endDate = row.end_date ? new Date(row.end_date) : null;
  const now = new Date();

  // TTL anchor: start_date if present, else created_at
  const anchor = startDate || createdAt;
  let ttlRemaining = null;
  const hasTtl = row.ttl_seconds !== null && row.ttl_seconds !== undefined;
  if (anchor && hasTtl) {
    if (now < anchor) {
      // Before start: show full TTL
      ttlRemaining = row.ttl_seconds;
    } else {
      const elapsedSeconds = (now.getTime() - anchor.getTime()) / 1000;
      ttlRemaining = Math.max(0, row.ttl_seconds - elapsedSeconds);
    }
  }

  let status = row.status;

  // Auto-activate in view if planning and start time passed
  if (status === 'planning' && anchor && now >= anchor) {
    status = 'active';
  }

  // If status is completed but nothing has actually expired yet, keep it active/planning.
  if (status === 'completed') {
    const nothingToExpire =
      (row.ttl_seconds === null || row.ttl_seconds === undefined) &&
      !endDate;
    const notStartedYet = anchor && now < anchor;
    if (nothingToExpire) {
      status = notStartedYet ? 'planning' : 'active';
    } else if (notStartedYet) {
      status = 'planning';
    }
  }

  const isExpiredByTtl = ttlRemaining !== null && ttlRemaining <= 0 && anchor && now >= anchor;
  const isExpiredByEndDate = endDate && now > endDate;
  if (status === 'active' && (isExpiredByTtl || isExpiredByEndDate)) {
    status = 'completed';
  }

  return { ...row, ttl_remaining: ttlRemaining, status };
}

// -------------------------
// GET /admin - Render the admin panel
router.get('/', async (req, res) => {
    try {
        await expireExperimentsIfNeeded();
        const { rows } = await db.query(
            `SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
                    TO_CHAR(exp.start_date, 'YYYY-MM-DD') as start_date, 
                    TO_CHAR(exp.end_date, 'YYYY-MM-DD') as end_date, 
                    adm.username as created_by_admin_username,
                    exp.created_at,
                    exp.ttl_seconds
             FROM experiments exp
             LEFT JOIN admins adm ON exp.created_by_admin_id = adm.admin_id
             ORDER BY exp.created_at DESC LIMIT 10` // Fetch recent 10 experiments
        );
        
        res.render('admin', { 
            title: 'Admin Panel',
            experiments: rows.map(computeExperimentView), // rows will be an array of experiment objects
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
        startTime,
        endDate,
        endTime,
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
        (name, type, description, status, config_details, start_date, end_date, ttl_seconds, created_by_admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING experiment_id;
        `;
        
        // Build start/end timestamps (date + optional time)
        const startDateTime = (startDate || '').trim() ? `${startDate.trim()}${startTime ? ' ' + startTime.trim() : ''}` : null;
        const endDateTime = (endDate || '').trim() ? `${endDate.trim()}${endTime ? ' ' + endTime.trim() : ''}` : null;
        // Validate date ordering to avoid check constraint failures
        if (startDateTime && endDateTime) {
            const sd = new Date(startDateTime);
            const ed = new Date(endDateTime);
            if (ed < sd) {
                return res.redirect('/admin?error=End date/time must be after start date/time');
            }
        }
        const ttlValue = (startDateTime && endDateTime)
          ? Math.max(0, Math.floor((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 1000))
          : null;
        
        const values = [
            experimentName,
            experimentType,
            description,
            status,
            config_details,
            startDateTime, 
            endDateTime,
            ttlValue,
            created_by_admin_id
        ];

        const { rows } = await db.query(queryText, values);
        const newExperimentId = rows[0].experiment_id;

        console.log(`New experiment scheduled with ID: ${newExperimentId}`);
        console.log("Experiment details:", {
            name: experimentName,
            type: experimentType,
            description: description,
            status: status,
            config_details: config_details,
            start_date: startDateTime,
            end_date: endDateTime,
            ttl_seconds: ttlValue,
            created_by_admin_id: created_by_admin_id
        });
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
    await expireExperimentsIfNeeded();
    // Fetch experiment details
    const expQuery = `
      SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
             TO_CHAR(exp.start_date, 'YYYY-MM-DD HH24:MI:SS') as start_date, 
             TO_CHAR(exp.end_date, 'YYYY-MM-DD HH24:MI:SS') as end_date, 
             TO_CHAR(exp.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
             exp.created_at as created_at_raw,
             exp.ttl_seconds,
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
    const experiment = computeExperimentView(experimentResult.rows[0]);

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
    await expireExperimentsIfNeeded();
    const { rows } = await db.query(
      `SELECT exp.experiment_id, exp.name, exp.type, exp.status, 
              TO_CHAR(exp.start_date, 'YYYY-MM-DD') as start_date, 
              TO_CHAR(exp.end_date, 'YYYY-MM-DD') as end_date, 
              adm.username as created_by_admin_username,
              exp.description, exp.config_details, exp.created_at, exp.ttl_seconds
       FROM experiments exp
       LEFT JOIN admins adm ON exp.created_by_admin_id = adm.admin_id
       ORDER BY exp.status, exp.created_at DESC`
    );
    res.render('experiments', {
      title: 'All Experiments',
      experiments: rows.map(computeExperimentView),
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

    res.render('participants', { 
      title: 'Manage Participants', 
      participants: participants,
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

// GET /admin/content - View content management page (DB-backed, with tags)
router.get('/content', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.content_id,
        c.video_url,
        c.description_caption,
        c.thumbnail_url,
        c.duration_seconds,
        c.tag_ids,
        c.uploaded_at,
        c.custom_metadata,
        COALESCE(array_agg(t.tag_name) FILTER (WHERE t.tag_id IS NOT NULL), ARRAY[]::TEXT[]) AS tag_names
      FROM content c
      LEFT JOIN LATERAL unnest(COALESCE(c.tag_ids, ARRAY[]::INTEGER[])) AS ut(tag_id) ON true
      LEFT JOIN tags t ON t.tag_id = ut.tag_id
      GROUP BY c.content_id, c.video_url, c.description_caption, c.thumbnail_url, c.duration_seconds, c.tag_ids, c.uploaded_at, c.custom_metadata
      ORDER BY c.content_id DESC
    `;

    const { rows } = await db.query(query);

    const videos = rows.map(row => {
      const meta = row.custom_metadata || {};
      return {
        id: row.content_id,
        uri: row.video_url,
        caption: row.description_caption,
        thumbnail_url: row.thumbnail_url || meta.thumbnail_url || null,
        duration_seconds: row.duration_seconds,
        uploaded_at: row.uploaded_at,
        enabled: meta.enabled !== undefined ? meta.enabled : true,
        tags: row.tag_names || [],
        source: meta.source || { name: 'Unknown Source', imageuri: 'https://i.imgur.com/P8OOZMm.png' },
        metadata: meta.metadata || {}
      };
    });

    const allTags = videos.flatMap(video => video.tags || []);
    const uniqueTags = [...new Set(allTags)];

    res.render('content', {
      title: 'Content Management',
      videos,
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

// POST /admin/content/upload - Handle content upload with enhanced metadata and tag linkage
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

    // Parse tag names from input and fetch existing tag_ids; ignore non-existent tags
    const rawTagNames = (tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const normalizedTagNames = rawTagNames.map(t => t.replace(/^#/, '').toLowerCase());
    const lookupNames = Array.from(new Set([...normalizedTagNames, ...rawTagNames.map(t => t.toLowerCase())]));

    let matchedTagIds = [];
    if (lookupNames.length > 0) {
      const { rows } = await db.query(
        `SELECT tag_id FROM tags WHERE lower(tag_name) = ANY($1::text[])`,
        [lookupNames]
      );
      matchedTagIds = rows.map(r => r.tag_id);
    }

    const themeArray = content_themes ? content_themes.split(',').map(theme => theme.trim()).filter(theme => theme) : [];
    const audioCharArray = audio_characteristics ? audio_characteristics.split(',').map(char => char.trim()).filter(char => char) : [];

    // Create enhanced content object with comprehensive metadata
    const customMetadata = {
      source: source_name ? {
        name: source_name,
        imageuri: source_image || null
      } : {
        name: 'Admin Upload',
        imageuri: 'https://i.imgur.com/P8OOZMm.png'
      },
      likes: 0,
      facts: [],
      tags: rawTagNames, // keep original tag strings for display
      enabled: true,
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
        } : null,
        matched_tag_ids: matchedTagIds // stored for transparency; main linkage is tag_ids column
      }
    };

    // Persist to content table with tag_ids linkage
    const insertQuery = `
      INSERT INTO content (
        video_url,
        description_caption,
        thumbnail_url,
        duration_seconds,
        custom_metadata,
        tag_ids
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING content_id
    `;

    await db.query(insertQuery, [
      finalVideoUrl,
      title || caption || 'Uploaded video',
      finalThumbnailUrl || null,
      duration ? parseInt(duration) : null,
      JSON.stringify(customMetadata),
      matchedTagIds.length > 0 ? matchedTagIds : []
    ]);

    res.redirect('/admin/content?message=Content uploaded (existing tags linked; others ignored)');
  } catch (error) {
    console.error('Error uploading content:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.redirect('/admin/content?error=File too large. Maximum size is 500MB.');
    } else if (error.message && error.message.includes('Only video files are allowed')) {
      res.redirect('/admin/content?error=Invalid file type. Only video files are allowed.');
    } else {
      res.redirect('/admin/content?error=Failed to upload content: ' + error.message);
    }
  }
});

// POST /admin/content/:id/delete - Delete content (DB)
router.post('/content/:id/delete', async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await db.query('DELETE FROM content WHERE content_id = $1 RETURNING content_id', [id]);
    if (deleteResult.rowCount === 0) {
      return res.redirect('/admin/content?error=Video not found');
    }
    res.redirect('/admin/content?message=Content deleted successfully');
  } catch (error) {
    console.error(`Error deleting content ID ${id}:`, error);
    res.redirect('/admin/content?error=Failed to delete content');
  }
});

// POST /admin/content/:id/toggle - Toggle content enabled/disabled status (DB)
router.post('/content/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const getResult = await db.query('SELECT custom_metadata FROM content WHERE content_id = $1', [id]);
    if (getResult.rows.length === 0) {
      return res.redirect('/admin/content?error=Video not found');
    }

    const currentMetadata = getResult.rows[0].custom_metadata || {};
    const currentEnabled = currentMetadata.enabled !== undefined ? currentMetadata.enabled : true;
    const newEnabled = !currentEnabled;
    const updatedMetadata = { ...currentMetadata, enabled: newEnabled };

    await db.query(
      'UPDATE content SET custom_metadata = $2 WHERE content_id = $1',
      [id, JSON.stringify(updatedMetadata)]
    );

    res.redirect(`/admin/content?message=Content ${newEnabled ? 'enabled' : 'disabled'} successfully`);
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

// GET /admin/tags - Tag management dashboard
router.get('/tags', async (req, res) => {
  const selectedTagId = req.query.tagId ? parseInt(req.query.tagId, 10) : null;
  try {
    const tags = await fetchTagsWithUsage();
    let taggedContent = [];

    if (selectedTagId) {
      taggedContent = await fetchContentForTag(selectedTagId);
    }

    res.render('tags', {
      title: 'Tag Management',
      tags,
      taggedContent,
      selectedTagId,
      message: req.query.message,
      error: null
    });
  } catch (error) {
    console.error('Error loading tags page:', error);
    res.render('tags', {
      title: 'Tag Management',
      tags: [],
      taggedContent: [],
      selectedTagId,
      error: 'Could not load tags data.'
    });
  }
});

// POST /admin/tags/create - Create a new tag
router.post('/tags/create', async (req, res) => {
  const { tag_name, tag_category, description } = req.body;
  const cleanedName = (tag_name || '').trim().replace(/^#/, '');
  const normalizedName = cleanedName.toLowerCase();
  const cleanedCategory = (tag_category || 'general').trim().toLowerCase() || 'general';

  if (!cleanedName) {
    return res.redirect('/admin/tags?error=Tag name is required');
  }

  try {
    const exists = await db.query(
      `SELECT 1 FROM tags WHERE lower(tag_name) = $1 AND lower(tag_category) = $2 LIMIT 1`,
      [normalizedName, cleanedCategory]
    );
    if (exists.rowCount > 0) {
      return res.redirect('/admin/tags?error=Tag already exists in this category');
    }

    const result = await db.query(
      `
        INSERT INTO tags (tag_name, tag_category, description, created_by_admin_id)
        VALUES ($1, $2, $3, $4)
        RETURNING tag_id
      `,
      [normalizedName, cleanedCategory, description || null, 1] // TODO: replace with authenticated admin id
    );

    res.redirect('/admin/tags?message=Tag created');
  } catch (error) {
    console.error('Error creating tag:', error);
    res.redirect('/admin/tags?error=Failed to create tag');
  }
});

// POST /admin/tags/:id/edit - Update an existing tag
router.post('/tags/:id/edit', async (req, res) => {
  const { id } = req.params;
  const { tag_name, tag_category, description } = req.body;
  const cleanedName = (tag_name || '').trim().replace(/^#/, '');
  const normalizedName = cleanedName.toLowerCase();
  const cleanedCategory = (tag_category || 'general').trim().toLowerCase() || 'general';

  if (!cleanedName) {
    return res.redirect('/admin/tags?error=Tag name is required');
  }

  try {
    const dupe = await db.query(
      `SELECT 1 FROM tags WHERE lower(tag_name) = $1 AND lower(tag_category) = $2 AND tag_id <> $3 LIMIT 1`,
      [normalizedName, cleanedCategory, id]
    );
    if (dupe.rowCount > 0) {
      return res.redirect('/admin/tags?error=Another tag already exists in this category');
    }

    const result = await db.query(
      `
        UPDATE tags
        SET tag_name = $1, tag_category = $2, description = $3
        WHERE tag_id = $4
        RETURNING tag_id
      `,
      [normalizedName, cleanedCategory, description || null, id]
    );

    if (result.rowCount === 0) {
      return res.redirect('/admin/tags?error=Tag not found');
    }

    res.redirect('/admin/tags?message=Tag updated');
  } catch (error) {
    console.error(`Error updating tag ${id}:`, error);
    res.redirect('/admin/tags?error=Failed to update tag');
  }
});

// POST /admin/tags/:id/delete - Delete a tag and remove it from content
router.post('/tags/:id/delete', async (req, res) => {
  const { id } = req.params;
  const tagId = parseInt(id, 10);

  if (Number.isNaN(tagId)) {
    return res.redirect('/admin/tags?error=Invalid tag id');
  }

  try {
    await db.query(
      'UPDATE content SET tag_ids = array_remove(tag_ids, $1::int) WHERE tag_ids @> ARRAY[$1::int];',
      [tagId]
    );

    const result = await db.query('DELETE FROM tags WHERE tag_id = $1 RETURNING tag_id', [tagId]);

    if (result.rowCount === 0) {
      return res.redirect('/admin/tags?error=Tag not found');
    }

    res.redirect('/admin/tags?message=Tag deleted');
  } catch (error) {
    console.error(`Error deleting tag ${tagId}:`, error);
    res.redirect('/admin/tags?error=Failed to delete tag');
  }
});

module.exports = router;