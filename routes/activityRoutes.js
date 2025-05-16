const express = require('express');
const router = express.Router();

const { createActivity, getAllActivities, getActivityById, getActivityByCompleted } = require('../controllers/activityControllers');

// POST /activity
router.post('/post', createActivity);

router.get('/completed', getActivityByCompleted);
// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);


module.exports = router;
