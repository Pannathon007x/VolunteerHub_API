const express = require('express');
const router = express.Router();

const { joinActivity, getCompletedActivities, getUserRegisteredActivities, userGetAllActivities, getProfileWithHours, getActivityTypes } = require('../controllers/userControllers');

//  /user
router.post('/join/:userId/:activityId', joinActivity);

router.get('/activity/completed',getCompletedActivities);

router.get('/registed',getUserRegisteredActivities);

router.get('/filltefetchActivityTypesrActivity', userGetAllActivities);

router.get('/profile/:id', getProfileWithHours);

router.get('/activity/types', getActivityTypes);

module.exports = router;