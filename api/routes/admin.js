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

    res.render('participants', { 
      title: 'Manage Participants', 
      participants: participants,
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
    
    // Find users not already in this experiment
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

module.exports = router; 