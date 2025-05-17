const express = require('express');
const router = express.Router();

const { joinActivity, getParticipants, getCompletedActivities, getUserRegisteredActivities, userGetAllActivities } = require('../controllers/userControllers');

// POST /user/join/:id
router.post('/join/:id', joinActivity);

// GET /user/:id/participants
router.get('/participants/:id', getParticipants);

router.get('/activity/completed',getCompletedActivities);

router.get('/registed/:id',getUserRegisteredActivities);

router.get('/fillterActivity', userGetAllActivities)

module.exports = router;