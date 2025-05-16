const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();

// MariaDB Connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});


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

// ฟังก์ชันอนุมัติกิจกรรม 
const approveActivity = async (req, res) => {
  const activityId = req.params.id;

  try {
   
    const activity = await queryDb(
      'SELECT * FROM activities WHERE id = ? AND status = ?',
      [activityId, 'pending']
    );

    if (activity.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่รออนุมัติ' });
    }

    // อัปเดตสถานะเป็น completed
    await queryDb(
      'UPDATE activities SET status = ? WHERE id = ?',
      ['completed', activityId]
    );

    res.status(200).json({ message: 'อนุมัติกิจกรรมเรียบร้อยแล้ว' });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอนุมัติกิจกรรม:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// ฟังก์ชันยกเลิกกิจกรรม
const cancelActivity = async (req, res) => {
  const activityId = req.params.id;

  try {
    const activity = await queryDb(
        'SELECT * FROM activities WHERE id = ? AND status IN (?, ?, ?, ?, ?, ?)',
        [activityId, 'draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled']
    );

    if (activity.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่รออนุมัติ' });
    }

    // อัปเดตสถานะเป็น cancelled (สองตัว L)
    await queryDb(
      'UPDATE activities SET status = ? WHERE id = ?',
      ['cancelled', activityId]
    );

    res.status(200).json({ message: 'ยกเลิกกิจกรรมเรียบร้อยแล้ว' });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกกิจกรรม:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};


module.exports = { approveActivity, cancelActivity };

