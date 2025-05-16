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

// Get All Activities (Filter + Pagination)
const getAllActivities = async (req, res) => {
    const { page = 1, limit = 10, status, activity_type_id } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

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

        const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Total count
        const countResult = await queryDb(`SELECT COUNT(*) AS total FROM activities ${whereSql}`, values);
        const total = countResult[0].total;

        // Get actual data
        const activities = await queryDb(
            `SELECT * FROM activities ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...values, limitNum, offset]
        );

        res.json({
            total,
            page: pageNum,
            limit: limitNum,
            data: activities
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: error.message });
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

const completeActivity = async (req, res) => {
  const { id: activityId } = req.params;

  try {
    // 1. อัปเดตสถานะกิจกรรมเป็น completed
    await queryDb(`UPDATE activities SET status = 'completed' WHERE id = ?`, [activityId]);

    // 2. อัปเดตชั่วโมงนิสิตที่เข้าร่วมและสถานะ completed + attendance true
    await queryDb(`
      UPDATE users u
      JOIN activity_registrations ar ON u.id = ar.user_id
      JOIN activities a ON ar.activity_id = a.id
      SET u.volunteer_hours = u.volunteer_hours + a.hour_value,
          ar.hours_earned = a.hour_value
      WHERE ar.activity_id = ? AND ar.attendance = TRUE AND ar.registration_status = 'completed'
    `, [activityId]);

    res.status(200).json({ message: 'กิจกรรมเสร็จสมบูรณ์ และอัปเดตชั่วโมงจิตอาสาเรียบร้อย' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: error.message });
  }
};




module.exports = {
    getAllActivities,
    getActivityById,
    completeActivity
};
