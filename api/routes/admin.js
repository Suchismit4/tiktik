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
    console.log('Received experiment schedule request:');
    console.log(req.body);
    // TODO: Add logic to save the experiment details to the database
    console.log(`Scheduling experiment: ${req.body.experimentName}`);
    // Redirect back to the admin panel, perhaps with a success message
    res.redirect('/admin');
});

// POST /admin/download/:id - Handle data download request
router.post('/download/:id', (req, res) => {
    const experimentId = req.params.id;
    console.log(`Received download request for experiment ID: ${experimentId}`);
    // TODO: Add logic to fetch data for the experiment ID and prepare for download
    // For now, just log and redirect
    console.log('Simulating data download...');
    // In a real scenario, would set headers and send a file
    // res.setHeader('Content-disposition', 'attachment; filename=experiment_data.csv');
    // res.set('Content-Type', 'text/csv');
    // res.status(200).send('col1,col2\nval1,val2'); // Example CSV data
    res.redirect('/admin'); // Redirect back for now
});


module.exports = router; 