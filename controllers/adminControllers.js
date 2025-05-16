const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();

// สร้าง connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// helper function สำหรับ query DB แบบ promise
const queryDb = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
};

// 🟢 ฟังก์ชัน: ดูรายละเอียดกิจกรรม + รายชื่อนิสิตที่สมัคร
const getActivityDetails = async (req, res) => {
  const activityId = req.params.id;

  try {
    // ดึงรายละเอียดกิจกรรม
    const activityDetails = await queryDb('SELECT * FROM activities WHERE id = ?', [activityId]);
    if (activityDetails.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรม' });
    }

    // ดึงรายชื่อนิสิตที่สมัครในกิจกรรมนี้
    const participants = await queryDb(
      `SELECT u.id, u.student_id, u.first_name, u.last_name, u.email, u.faculty, u.department
       FROM activity_registrations ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.activity_id = ?`,
      [activityId]
    );

    // ส่งข้อมูลกลับไป
    return res.status(200).json({
      message: 'ดึงข้อมูลกิจกรรมสำเร็จ',
      activity: activityDetails[0],
      participants,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดจาก server' });
  }
};

module.exports = { getActivityDetails };
