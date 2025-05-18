const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool to MariaDB
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Helper function to query the database
const queryDb = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// Register function
const register = async (req, res) => {
  const { student_id, password, first_name, last_name, email, faculty, department } = req.body;

  try {
    // Check if email already exists
    const userExists = await queryDb('SELECT * FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Check total user count to decide role
    const totalUsers = await queryDb('SELECT COUNT(*) AS count FROM users');
    const role = totalUsers[0].count === 0 ? 'admin' : 'student';

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database with role
    const result = await queryDb(
      'INSERT INTO users (student_id, password, first_name, last_name, email, faculty, department, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_id, hashedPassword, first_name, last_name, email, faculty, department, role]
    );

    res.status(201).json({ success: true, message: 'User registered successfully', role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

  try {
    const user = await queryDb('SELECT * FROM users WHERE email = ? AND role = ?', [email, "admin"]);
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ตรวจสอบสถานะ user_status
    if (user[0].user_status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned and cannot login.' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  console.log("Student login:", email);

  try {
    const user = await queryDb('SELECT * FROM users WHERE email = ? AND role = ?', [email, "student"]);
    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ตรวจสอบสถานะ user_status
    if (user[0].user_status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned and cannot login.' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { register, loginAdmin, loginStudent};
