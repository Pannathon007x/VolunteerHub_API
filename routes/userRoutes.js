const express = require('express');
const router = express.Router();

const { joinActivity, getParticipants, getCompletedActivities } = require('../controllers/userControllers');

// POST /user/:id/join
router.post('/join/:id', joinActivity);

// GET /user/:id/participants
router.get('/:id/participants', getParticipants);

router.get('/activity/completed',getCompletedActivities);

module.exports = router;