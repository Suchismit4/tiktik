const express = require('express');
const router = express.Router();

// GET /admin - Render the admin panel
router.get('/', (req, res) => {
    // For now, pass some dummy data. Replace with actual data fetching later.
    const experiments = [
        { id: 1, name: 'Test A/B Experiment', type: 'A/B Test', status: 'Running', startDate: '2024-01-01', endDate: '2024-01-15' },
        { id: 2, name: 'User Behavior Survey', type: 'Survey', status: 'Completed', startDate: '2023-12-01', endDate: '2023-12-10' },
        { id: 3, name: 'Mobile App A/B Test', type: 'A/B Test', status: 'Running', startDate: '2024-02-10', endDate: '2024-02-25' },
        { id: 4, name: 'Recommendation Algorithm Study', type: 'Behavioral', status: 'Completed', startDate: '2023-11-15', endDate: '2023-11-30' },
        { id: 5, name: 'User Engagement Analysis', type: 'Behavioral', status: 'Completed', startDate: '2023-10-01', endDate: '2023-10-31' }
    ];
    
    res.render('admin', { 
        title: 'Admin Panel',
        experiments: experiments
    });
});

// POST /admin/schedule - Handle scheduling a new experiment
router.post('/schedule', (req, res) => {
    const { 
        experimentName, 
        experimentType, 
        description, 
        startDate, 
        endDate, 
        participants, 
        surveyOptions, 
        behaviorNotes 
    } = req.body;
    
    console.log('Scheduling New Experiment:');
    console.log({
        experimentName,
        experimentType,
        description,
        startDate,
        endDate,
        participants,
        surveyOptions,
        behaviorNotes
    });

    // TODO: Save this data to the database later
    res.redirect('/admin');
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
router.get('/results/:id', (req, res) => {
    const experimentId = req.params.id;

    // Fake participant data for now
    const results = [
        { participant: 'John Doe', score: '87%', completed: 'Yes' },
        { participant: 'Jane Smith', score: '92%', completed: 'Yes' },
        { participant: 'Alex Johnson', score: '78%', completed: 'No' }
    ];

    res.render('results', { 
        title: `Results for Experiment ${experimentId}`,
        experimentId,
        results
    });
});


// View all experiments
router.get('/experiments', (req, res) => {
    const experiments = [
      { id: 1, name: 'Test A/B Experiment', type: 'A/B Test', status: 'Running', startDate: '2024-01-01', endDate: '2024-01-15' },
      { id: 2, name: 'User Behavior Survey', type: 'Survey', status: 'Completed', startDate: '2023-12-01', endDate: '2023-12-10' },
      { id: 3, name: 'Mobile App A/B Test', type: 'A/B Test', status: 'Running', startDate: '2024-02-10', endDate: '2024-02-25' },
      { id: 4, name: 'Recommendation Algorithm Study', type: 'Behavioral', status: 'Completed', startDate: '2023-11-15', endDate: '2023-11-30' },
      { id: 5, name: 'User Engagement Analysis', type: 'Behavioral', status: 'Completed', startDate: '2023-10-01', endDate: '2023-10-31' }
    ];
  
    res.render('experiments', {
      title: 'All Experiments',
      experiments: experiments
    });
  });
  
// View participants
router.get('/participants', (req, res) => {
    res.render('participants', { title: 'Manage Participants' });
});

// View settings (login/logout page)
router.get('/settings', (req, res) => {
    res.render('settings', { title: 'Settings' });
});


module.exports = router; 