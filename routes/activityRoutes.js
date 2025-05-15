const express = require('express');
const router = express.Router();

const { createActivity, getAllActivities, getActivityById } = require('../controllers/activityControllers');

// POST /activity
router.post('/', createActivity);



// GET /activity
router.get('/', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);


module.exports = router;
