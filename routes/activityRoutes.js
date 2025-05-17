const express = require('express');
const router = express.Router();

const { getActivityById, closeActivity } = require('../controllers/activityControllers');




// GET /activity/:id
router.get('/:id', getActivityById);

// ปิดกิจกรรมและแจกเวลาให้ผู้เข้าร่วม
router.put('/closeactivity/:id', closeActivity);



module.exports = router;
