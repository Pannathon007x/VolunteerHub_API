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




// Get activity by ID
const getActivityById = async (req, res) => {
  const activityId = parseInt(req.params.id);
  if (isNaN(activityId)) {
    return res.status(400).json({ message: 'Invalid activity id' });
  }
  try {
    const rows = await queryDb('SELECT * FROM activities WHERE id = ?', [activityId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ฟังก์ชันปิดกิจกรรม
const closeActivity = async (req, res) => {
  const { id: activityId } = req.params;

  try {
    // 1. อัปเดตสถานะกิจกรรมเป็น 'rejected' (ปิดกิจกรรม)
    await queryDb(
      `UPDATE activities
         SET status = 'completed'
         WHERE id = ?`,
      [activityId]
    );

    // 2. จ่ายชั่วโมงจิตอาสาให้ผู้เข้าร่วมทุกคน ตาม hour_value ของกิจกรรมนั้น
    await queryDb(
        `UPDATE activity_registrations ar
        JOIN activities a ON ar.activity_id = a.id
        JOIN users u ON u.id = ar.user_id
        SET ar.hours_earned = a.hour_value,
        u.volunteer_hours = u.volunteer_hours + a.hour_value,
        ar.registration_status = 'completed'
        WHERE ar.activity_id = ? AND ar.registration_status = 'pending'`,
    [activityId]
);

    res.status(200).json({
      message: 'ปิดกิจกรรมเรียบร้อย และจ่ายชั่วโมงจิตอาสาให้ผู้เข้าร่วมทุกคนตามที่กำหนดแล้ว'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการปิดกิจกรรม',
      error: error.message
    });
  }
};

async function getActivitiesByTypeId(req, res) {
  const { activity_type_id } = req.params;  // รับจาก route param เช่น /activities/type/:activity_type_id

  if (!activity_type_id) {
    return res.status(400).json({ success: false, message: "activity_type_id ต้องระบุ" });
  }

  try {
    const sql = `
      SELECT *
      FROM activities
      WHERE activity_type_id = ?
      AND status = 'approved'
      ORDER BY start_datetime ASC
    `;
    const activities = await queryDb(sql, [activity_type_id]);

    return res.json({ success: true, data: activities });
  } catch (error) {
    console.error("Error fetching activities by type:", error);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์" });
  }
}

module.exports = {
    getActivityById,
    closeActivity,
    getActivitiesByTypeId
};
