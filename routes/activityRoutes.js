const express = require('express');
const router = express.Router();

const { getActivityById, closeActivity, getActivitiesByTypeId } = require('../controllers/activityControllers');




// GET /activity/:id
router.get('/:id', getActivityById);

// ปิดกิจกรรมและแจกเวลาให้ผู้เข้าร่วม
router.put('/closeactivity/:id', closeActivity);

router.get('/type/:activity_type_id', getActivitiesByTypeId);




module.exports = router;
