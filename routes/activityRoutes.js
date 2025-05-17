const express = require('express');
const router = express.Router();

const { getAllActivities, getActivityById, closeActivity ,updateActivity } = require('../controllers/activityControllers');


// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);

// ปิดกิจกรรมและแจกเวลาให้ผู้เข้าร่วม
router.put('/closeactivity/:id', closeActivity);

// หลังบรรทัด router.get('/:id', getActivityById);
router.put('/:id', updateActivity);

module.exports = router;
