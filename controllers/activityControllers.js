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
  const { page = 1, limit = 10, status, activity_type_id, search } = req.query; // เพิ่ม search
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let whereClauses = [];
    let values = [];
    if (status) {
      whereClauses.push('a.status = ?');
      values.push(status);
    }
    if (activity_type_id) {
      whereClauses.push('a.activity_type_id = ?');
      values.push(activity_type_id);
    }
    if (search) {
      whereClauses.push('a.title LIKE ?');
      values.push(`%${search}%`);
    }

    const whereSql = whereClauses.length
      ? 'WHERE ' + whereClauses.join(' AND ')
      : '';

    // นับทั้งหมด
    const countResult = await queryDb(
      `SELECT COUNT(*) AS total
       FROM activities a
       ${whereSql}`,
      values
    );
    const total = countResult[0].total;

    // ดึงข้อมูล
    const activities = await queryDb(
      `SELECT a.*, at.name AS activity_type_name
       FROM activities a
       JOIN activity_types at ON a.activity_type_id = at.id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
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
    res.status(500).json({ message: 'Server error' });
  }
};

// const getAllActivities = async (req, res) => {
//     const { page = 1, limit = 10, status, activity_type_id } = req.query;

//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const offset = (pageNum - 1) * limitNum;

//     try {
//         let whereClauses = [];
//         let values = [];

//         if (status) {
//             whereClauses.push('status = ?');
//             values.push(status);
//         }

//         if (activity_type_id) {
//             whereClauses.push('activity_type_id = ?');
//             values.push(activity_type_id);
//         }

//         const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

//         // Total count
//         const countResult = await queryDb(`SELECT COUNT(*) AS total FROM activities ${whereSql}`, values);
//         const total = countResult[0].total;

//         // Get actual data
//         const activities = await queryDb(
//             `SELECT * FROM activities ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
//             [...values, limitNum, offset]
//         );

//         res.json({
//             total,
//             page: pageNum,
//             limit: limitNum,
//             data: activities
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: error.message });
//     }
// };

// Get activity by ID
const getActivityById = async (req, res) => {
    const { id } = req.params;

    try {
        const activities = await queryDb(`SELECT
         a.*,
         at.id   AS activity_type_id,
         at.name AS activity_type_name
       FROM activities a
       JOIN activity_types at
         ON a.activity_type_id = at.id
       WHERE a.id = ?`,
      [id]);

        if (activities.length === 0) {
            return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
        }

        res.json(activities[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', error: error.message });
    }
};

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
         JOIN users u       ON u.id = ar.user_id
         -- ถ้าอยากจ่ายชั่วโมงเฉพาะคนที่มาจริง ให้เพิ่ม AND ar.attendance = TRUE ไว้ใน WHERE
       SET ar.hours_earned   = a.hour_value,
           u.volunteer_hours = u.volunteer_hours + a.hour_value
       WHERE ar.activity_id = ?`,
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

// Update activity เพิ่มใหม่
const updateActivity = async (req, res) => {
  const { id } = req.params;
  const { title, description, activity_type_id, start_datetime, end_datetime } = req.body;

  try {
    // 1. ทำการอัปเดตข้อมูลตามปกติ
    await queryDb(
      `UPDATE activities
         SET title             = ?,
             description       = ?,
             activity_type_id  = ?,
             start_datetime    = ?,
             end_datetime      = ?
       WHERE id = ?`,
      [title, description, activity_type_id, start_datetime, end_datetime, id]
    );

    // 2. ดึงกิจกรรมที่อัปเดตแล้วกลับมา
    const [updated] = await queryDb(
      `SELECT
         a.*,
         at.name AS activity_type_name
       FROM activities a
       JOIN activity_types at
         ON a.activity_type_id = at.id
       WHERE a.id = ?`,
      [id]
    );

    // 3. ส่งกลับทั้ง message และ object ของกิจกรรมที่อัปเดตแล้ว
    res.json({
      message: 'แก้ไขเรียบร้อย',
      activity: updated
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


module.exports = {
    getAllActivities,
    getActivityById,
    closeActivity,
    updateActivity
};
