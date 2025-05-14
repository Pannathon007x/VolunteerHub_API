const express = require('express');
const router = express.Router();

const { createActivity } = require('../controllers/activityControllers');

// POST /activity
router.post('/', createActivity);

module.exports = router;
