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


// Edit Activity by Admin
const editActivity = async (req, res) => {
  const activityId = parseInt(req.params.id);
  if (isNaN(activityId)) {
    return res.status(400).json({ message: 'รหัสกิจกรรมไม่ถูกต้อง' });
  }

  // รับข้อมูลที่จะอัปเดตจาก body
  const {
    title,
    description,
    activity_type_id,
    start_datetime,
    end_datetime,
    location,
    max_participants,
    hour_value,
    status
  } = req.body;

  // สร้างอ็อบเจ็กต์เก็บข้อมูลที่จะอัปเดตเฉพาะที่มีค่าไม่ undefined
  const fieldsToUpdate = {};
  if (title !== undefined) fieldsToUpdate.title = title;
  if (description !== undefined) fieldsToUpdate.description = description;
  if (activity_type_id !== undefined) fieldsToUpdate.activity_type_id = activity_type_id;
  if (start_datetime !== undefined) fieldsToUpdate.start_datetime = start_datetime;
  if (end_datetime !== undefined) fieldsToUpdate.end_datetime = end_datetime;
  if (location !== undefined) fieldsToUpdate.location = location;
  if (max_participants !== undefined) fieldsToUpdate.max_participants = max_participants;
  if (hour_value !== undefined) fieldsToUpdate.hour_value = hour_value;
  if (status !== undefined) fieldsToUpdate.status = status;

  // ถ้าไม่มีข้อมูลจะอัปเดตเลย ให้แจ้ง error
  if (Object.keys(fieldsToUpdate).length === 0) {
    return res.status(400).json({ message: 'ไม่มีข้อมูลสำหรับแก้ไข' });
  }

  // เตรียม SQL และค่าที่จะใช้
  const setClauses = [];
  const values = [];
  for (const [key, val] of Object.entries(fieldsToUpdate)) {
    setClauses.push(`${key} = ?`);
    values.push(val);
  }
  values.push(activityId);

  const sql = `UPDATE activities SET ${setClauses.join(', ')} WHERE id = ?`;

  try {
    // เรียกฐานข้อมูล สมมติใช้ queryDb เป็นฟังก์ชัน promise query
    const result = await queryDb(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ต้องการแก้ไข' });
    }

    res.status(200).json({ message: 'แก้ไขกิจกรรมสำเร็จ' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขกิจกรรม', error: error.message });
  }
};


// Get All Activities 
const getAllActivities = async (req, res) => {
  const { status, activity_type_id, title } = req.query;  // แก้ 'titel' เป็น 'title'

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let values = [];

    if (status) {
      whereClauses.push('status = ?');
      values.push(status);
    }

    if (activity_type_id) {
      whereClauses.push('activity_type_id = ?');
      values.push(activity_type_id);
    }

    if (title) {
      whereClauses.push('title LIKE ?');  // ใช้ชื่อ column ถูกต้อง 'title'
      values.push(`%${title}%`);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countResult = await queryDb(
      `SELECT COUNT(*) AS total FROM activities ${whereSql}`,
      values
    );
    const total = countResult[0].total;

    const activities = await queryDb(
      `SELECT * FROM activities ${whereSql} ORDER BY created_at ASC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: error.message });
  }
};

// change role user to Staff function
const changeRoleToStaff = async (req, res) => {
  const userId = req.query.id;  // ดึงจาก query string

  if (!userId) {
    return res.status(400).json({ message: 'กรุณาระบุ id ของผู้ใช้' });
  }

  try {
    // Check if the user exists
    const user = await queryDb('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }

    // Update the user's role to 'staff'
    await queryDb('UPDATE users SET role = ? WHERE id = ?', ['staff', userId]);

    res.status(200).json({ message: 'เปลี่ยนบทบาทผู้ใช้เป็น Staff เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// Show staff
const showStaff = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // นับจำนวนทั้งหมด
    const countResult = await queryDb('SELECT COUNT(*) AS total FROM users WHERE role = ?', ['staff']);
    const total = countResult[0].total;

    // ดึงข้อมูลแบบแบ่งหน้า
    const staff = await queryDb(
      'SELECT * FROM users WHERE role = ? LIMIT ? OFFSET ?',
      ['staff', limit, offset]
    );

    res.status(200).json({
      message: 'ดึงข้อมูล Staff สำเร็จ',
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: staff,
    });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล Staff:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

//Edit staff
const editStaff = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email } = req.body;


  try {
    // Update staff information
    console.log(first_name, last_name, email, id);
    await queryDb(
      'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [first_name, last_name, email, id]
    );

    res.status(200).json({ message: 'แก้ไขข้อมูล Staff เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูล Staff:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// change role user to Staff function
const changeRoleToUser = async (req, res) => {
  const userId = req.query.id;  // ดึงจาก query string

  if (!userId) {
    return res.status(400).json({ message: 'กรุณาระบุ id ของผู้ใช้' });
  }

  try {
    // Check if the user exists
    const user = await queryDb('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }

    // Update the user's role to 'staff'
    await queryDb('UPDATE users SET role = ? WHERE id = ?', ['staff', userId]);

    res.status(200).json({ message: 'เปลี่ยนบทบาทผู้ใช้เป็น User เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// Admin ban and unban 
const banUser = async (req, res) => {
  const userId = req.query.id;  // เปลี่ยนจาก req.params.id เป็น req.query.id
  const action = req.query.action;

  if (!userId) {
    return res.status(400).json({ message: 'กรุณาระบุ id ของผู้ใช้' });
  }

  if (!['ban', 'unban'].includes(action)) {
    return res.status(400).json({ message: 'action ต้องเป็น ban หรือ unban เท่านั้น' });
  }

  const newStatus = action === 'ban' ? 'banned' : 'active';

  try {
    const result = await queryDb(
      'UPDATE users SET user_status = ? WHERE id = ?',
      [newStatus, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }

    res.status(200).json({ message: `ผู้ใช้ถูก${action === 'ban' ? 'แบน' : 'ปลดแบน'}เรียบร้อยแล้ว` });
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะผู้ใช้:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};




module.exports = { approveActivity, cancelActivity, createActivity, getAllActivities, changeRoleToStaff, showStaff, editStaff, changeRoleToUser, editActivity, banUser };

