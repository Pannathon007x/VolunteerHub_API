const express = require('express');
const router = express.Router();

const { joinActivity, getCompletedActivities, getUserRegisteredActivities, userGetAllActivities, getProfileWithHours } = require('../controllers/userControllers');

// POST /user/join/:id
router.post('/join/:id', joinActivity);


router.get('/activity/completed',getCompletedActivities);

router.get('/registed',getUserRegisteredActivities);

router.get('/fillterActivity', userGetAllActivities);

router.get('/profile/:id', getProfileWithHours);

module.exports = router;