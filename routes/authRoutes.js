const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import database connection
db.connect(); // Connect to the database

const { login, register } = require('../controllers/authControllers');  

// POST /auth/login
router.post('/login', login);

// POST /auth/register
router.post('/register', register);  


module.exports = router;
