const express = require('express');
const router = express.Router();

const { createActivity, getAllActivities, getActivityById } = require('../controllers/activityControllers');

// POST /activity/post
router.post('/post', createActivity);



// GET /activity/get
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);


module.exports = router;
