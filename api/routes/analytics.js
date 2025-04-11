const express = require('express');
const router = express.Router();
const pool = require('../db');
router.post('/activity', async (req, res) => {
    const { userId, activityId, timestamp } = req.body;
    const query = `
        INSERT INTO activity_logs (user_id, activity_id, timestamp)
        VALUES ($1, $2, $3)
        RETURNING id
    `;
});

router.post('/survey', async (req, res) => {
    const { userId, surveyId, answers } = req.body;
    const query = `
        INSERT INTO surveys (user_id, survey_id, answers)
        VALUES ($1, $2, $3)
        RETURNING id
    `;
    
});