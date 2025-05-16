const express = require('express');
const router = express.Router();

const { getActivityDetails } = require('../controllers/activityControllers');

// GET /activity/details/:id
router.get('/details/:id', getActivityDetails);

module.exports = router;
