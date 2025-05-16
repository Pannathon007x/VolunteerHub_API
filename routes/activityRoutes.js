const express = require('express');
const router = express.Router();

const { getAllActivities, getActivityById, completeActivity } = require('../controllers/activityControllers');


// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);

// ทำกิจกรรมให้เสร็จ (อัปเดตสถานะ + ชั่วโมงจิตอาสา)
router.put('/:id/complete', completeActivity);

module.exports = router;
