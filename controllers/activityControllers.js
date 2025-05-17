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


module.exports = {
    getActivityById,
    closeActivity
};
