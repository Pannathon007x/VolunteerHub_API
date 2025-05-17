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

module.exports = { approveActivity, cancelActivity, createActivity };
