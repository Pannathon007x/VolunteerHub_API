const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import database connection
db.connect();

const { approveActivity, cancelActivity, createActivity, getActivityById, editActivity, getAllActivities } = require('../controllers/staffControllers');

// route สำหรับ staff ใช้เหมือน admin แต่แยก controller ของ staff
router.post('/post', createActivity);

router.patch('/approve/:id', approveActivity);

router.patch('/cancel/:id', cancelActivity);

router.get('/showac/:id', getActivityById);

router.patch('/editac/:id', editActivity);

router.get('/getac', getAllActivities);

module.exports = router;