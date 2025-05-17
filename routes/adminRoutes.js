const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import database connection
db.connect();

const { approveActivity, cancelActivity, createActivity, getAllActivities, changeRoleToStaff, showStaff, editStaff, changeRoleToUser, editActivity, banUser } = require('../controllers/adminControllers');

router.post('/post', createActivity);

router.patch('/approve/:id', approveActivity);

router.patch('/cancel/:id', cancelActivity);

// GET /activity/get
router.get('/', getAllActivities);

router.patch('/changeroletostaff', changeRoleToStaff)

router.get('/showstaff', showStaff)

router.patch('/editstaff/:id', editStaff)

router.patch('/changeroletouser', changeRoleToUser)

router.patch('/editactivity/:id', editActivity)

router.patch('/banuser', banUser)

module.exports = router;

