const express = require('express');
const router = express.Router();

const { getAllActivities, getActivityById, closeActivity } = require('../controllers/activityControllers');


// GET /activity
router.get('/get', getAllActivities);

// GET /activity/:id
router.get('/:id', getActivityById);

// ปิดกิจกรรมและแจกเวลาให้ผู้เข้าร่วม
router.put('/closeactivity/:id', closeActivity);



module.exports = router;
