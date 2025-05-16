const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Import database connection
db.connect(); // Connect to the database

const { login, register, loginStudent } = require('../controllers/authControllers');  

// POST /auth/login
router.post('/login', login);

// POST /auth/register
router.post('/register', register);  

// POST /auth/loginstudent
router.post('/loginstudent', loginStudent);  

module.exports = router;
