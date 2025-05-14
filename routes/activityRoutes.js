const express = require('express');
const router = express.Router();

const { createActivity, getAllActivities, getActivityById, joinActivity, getParticipants } = require('../controllers/activityControllers');

// POST /activity
router.post('/', createActivity);

// POST /activity/:id/join
router.post('/:id/join', joinActivity);

// GET /activity
router.get('/', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);

// GET /activity/:id/participants
router.get('/:id/participants', getParticipants);

module.exports = router;
