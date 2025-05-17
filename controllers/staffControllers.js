const db = require('../config/db'); // สมมติ queryDb import แบบนี้

const queryDb = (query, values) => {
  return new Promise((resolve, reject) => {
    db.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// ฟังก์ชันอนุมัติกิจกรรม (staff version)
const approveActivity = async (req, res) => {
  const activityId = req.params.id;

  try {
    // staff อาจจะไม่อนุมัติกิจกรรมที่ status 'pending' ได้โดยตรง (ถ้าต้องการจำกัด)
    // สมมติอนุญาตให้อนุมัติได้เหมือน admin แต่ถ้าต้องการจำกัดให้แก้ตรงนี้
    const activity = await queryDb(
      'SELECT * FROM activities WHERE id = ? AND status = ?',
      [activityId, 'pending']
    );

    if (activity.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่รออนุมัติ' });
    }

    // อัปเดตสถานะเป็น approved (staff อาจจะไม่ตั้งเป็น completed เลย)
    await queryDb(
      'UPDATE activities SET status = ? WHERE id = ?',
      ['approved', activityId]
    );

    res.status(200).json({ message: 'อนุมัติกิจกรรมโดย staff เรียบร้อยแล้ว' });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอนุมัติกิจกรรมโดย staff:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// ฟังก์ชันยกเลิกกิจกรรม (staff version)
const cancelActivity = async (req, res) => {
  const activityId = req.params.id;

  try {
    // staff อาจจะอนุญาตยกเลิกได้เฉพาะบางสถานะ (เช่น pending, approved)
    const activity = await queryDb(
        'SELECT * FROM activities WHERE id = ? AND status IN (?, ?)',
        [activityId, 'pending', 'approved']
    );

    if (activity.length === 0) {
      return res.status(404).json({ message: 'ไม่พบกิจกรรมที่สามารถยกเลิกได้' });
    }

    // อัปเดตสถานะเป็น cancelled
    await queryDb(
      'UPDATE activities SET status = ? WHERE id = ?',
      ['cancelled', activityId]
    );

    res.status(200).json({ message: 'ยกเลิกกิจกรรมโดย staff เรียบร้อยแล้ว' });

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยกเลิกกิจกรรมโดย staff:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
  }
};

// สร้างกิจกรรม (staff version)
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

    // Validation (เหมือน admin)
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
        // staff สร้างกิจกรรมได้เหมือน admin
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
                'pending'   // fix status เป็น pending เหมือน admin
            ]
        );

        return res.status(201).json({
            message: 'สร้างกิจกรรมโดย staff สำเร็จ',
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
        console.error('เกิดข้อผิดพลาดในการสร้างกิจกรรมโดย staff:', error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม', error: error.message });
    }
};

// Get activity by ID
const getActivityById = async (req, res) => {
    const { id } = req.params;

    try {
        const activities = await queryDb('SELECT * FROM activities WHERE id = ?', [id]);

        if (activities.length === 0) {
            return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
        }

        res.json(activities[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: error.message });
    }
};

//staff edit activity
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

//get all activity
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


module.exports = { approveActivity, cancelActivity, createActivity, getActivityById, editActivity, getAllActivities };
