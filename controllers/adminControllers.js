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

  // กำหนด adminId สำหรับทดสอบ (เปลี่ยนตามระบบจริง)
  const adminId = 1;

  try {
    const activity = await queryDb(
      'SELECT * FROM activities WHERE id = ? AND status = ?',
      [activityId, 'pending']
    );

    if (activity.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่รออนุมัติ' });
    }

    await queryDb(
      'UPDATE activities SET status = ? WHERE id = ?',
      ['approved', activityId]
    );

    await queryDb(
      `INSERT INTO activity_approvals (activity_id, admin_id, approval_status, approval_date) 
       VALUES (?, ?, ?, NOW())`,
      [activityId, adminId, 'approved']
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


// Create Activity
const createActivity = async (req, res) => {
    const {
        title,
        description,
        activity_type_id,
        start_datetime,
        end_datetime,
        location,
        max_participants,
        hour_value,
        creator_id
    } = req.body;

    // Validation
    if (
        !title ||
        !description ||
        !activity_type_id ||
        !start_datetime ||
        !end_datetime ||
        !location ||
        !max_participants ||
        !hour_value ||
        !creator_id
    ) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const result = await queryDb(
            `INSERT INTO activities 
            (title, description, activity_type_id, start_datetime, end_datetime, location, max_participants, hour_value, creator_id, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                title,
                description,
                activity_type_id,
                start_datetime,
                end_datetime,
                location,
                max_participants,
                hour_value,
                creator_id,
                'pending'   // fix status เป็น pending
            ]
        );

        return res.status(201).json({
            message: 'สร้างกิจกรรมสำเร็จ',
            activity: {
                id: result.insertId,
                title,
                description,
                activity_type_id,
                start_datetime,
                end_datetime,
                location,
                max_participants,
                hour_value,
                creator_id,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม', error: error.message });
    }
};



module.exports = { approveActivity, cancelActivity, createActivity };

