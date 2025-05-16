const express = require('express');
const router = express.Router();

const { createActivity, getAllActivities, getActivityById, completeActivity } = require('../controllers/activityControllers');

router.get('/completed', getActivityByCompleted);
// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);

// ทำกิจกรรมให้เสร็จ (อัปเดตสถานะ + ชั่วโมงจิตอาสา)
router.put('/:id/complete', completeActivity);


module.exports = router;
