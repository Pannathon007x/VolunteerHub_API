const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import database connection
db.connect();

const { approveActivity, cancelActivity  } = require('../controllers/adminControllers');

router.patch('/approve/:id', approveActivity);
router.patch('/cancel/:id', cancelActivity);


module.exports = router;
