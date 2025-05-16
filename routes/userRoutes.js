const express = require('express');
const router = express.Router();

const { joinActivity, getParticipants } = require('../controllers/userControllers');

// POST /user/:id/join     id คือ id activity
router.post('/:id/join', joinActivity);

// GET /user/:id/participants
router.get('/:id/participants', getParticipants);

module.exports = router;