const express = require('express');
const router = express.Router();

const { getAllActivities, getActivityById, getActivityByCompleted } = require('../controllers/activityControllers');

router.get('/completed', getActivityByCompleted);
// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);


module.exports = router;
