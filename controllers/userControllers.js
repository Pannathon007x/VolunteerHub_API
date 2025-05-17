
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

//Get participants of an activity
const getParticipants = (req, res) => {
    const { id } = req.params;
    const activityId = parseInt(id);

    const activity = activities.find(act => act.id === activityId);

    if (!activity) {
        return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
    }

    res.json({
        activityId: activity.id,
        participants: activity.participants
    });
};

// User join activity
const joinActivity = async (req, res) => {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const activityId = parseInt(id);

    try {
        // 1. ตรวจสอบว่ากิจกรรมมีอยู่จริงหรือไม่
        const activityRows = await queryDb(
            'SELECT * FROM activities WHERE id = ?', 
            [activityId]
        );

        if (activityRows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
        }
        const activity = activityRows[0];

        // 2. ตรวจสอบสถานะกิจกรรม ให้ลงได้เฉพาะ status = 'approved'
        if (activity.status !== 'approved') {
            return res.status(400).json({ message: 'ไม่สามารถสมัครกิจกรรมที่ยังไม่เสร็จสมบูรณ์ได้' });
        }

        // 3. ตรวจสอบว่าผู้ใช้สมัครไปแล้วหรือยัง
        const participantRows = await queryDb(
            'SELECT * FROM activity_registrations WHERE activity_id = ? AND user_id = ?',
            [activityId, userId]
        );

        if (participantRows.length > 0) {
            return res.status(400).json({ message: 'คุณสมัครเข้าร่วมกิจกรรมนี้ไปแล้ว' });
        }

        // 4. ตรวจสอบจำนวนผู้เข้าร่วม
        const participantsCountRows = await queryDb(
            'SELECT COUNT(*) AS count FROM activity_registrations WHERE activity_id = ?',
            [activityId]
        );

        const participantsCount = participantsCountRows[0].count;
        if (participantsCount >= activity.max_participants) {
            return res.status(400).json({ message: 'กิจกรรมเต็มแล้ว' });
        }

        // 5. เพิ่มข้อมูลผู้เข้าร่วมใหม่
        await queryDb(
            'INSERT INTO activity_registrations (activity_id, user_id) VALUES (?, ?)',
            [activityId, userId, userName]
        );

        res.json({
            message: 'สมัครเข้าร่วมกิจกรรมสำเร็จ',
            activityId: activity.id,
            participantsCount: participantsCount + 1
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
};

const getCompletedActivities = async (req, res) => {
  try {
    // 1. ดึงข้อมูลกิจกรรมที่เสร็จสมบูรณ์
    const completedRows = await queryDb(
      `SELECT
         id,
         title,
         description,
         activity_type_id,
         start_datetime,
         end_datetime,
         location,
         max_participants,
         hour_value,
         creator_id,
         status,
         created_at,
         updated_at
       FROM activities
       WHERE status = ?`,
      ['completed']
    );

    // 2. ถ้าไม่มีข้อมูลก็ส่งกลับเป็นอาเรย์ว่าง
    return res.status(200).json({
      message: 'โหลดกิจกรรมที่เสร็จสมบูรณ์สำเร็จ',
      activities: completedRows
    });
  } catch (error) {
    console.error('getCompletedActivities error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม',
      error: error.message
    });
  }
};

const getUserRegisteredActivities = async (req, res) => {
  const userId = parseInt(req.user,id); 

  if (!userId) {
    return res.status(400).json({ message: 'ไม่พบรหัสผู้ใช้' });
  }

  try {
    const rows = await queryDb(
      `SELECT
         a.id,
         a.title,
         a.description,
         a.activity_type_id,
         a.start_datetime,
         a.end_datetime,
         a.location,
         a.max_participants,
         a.hour_value,
         a.creator_id,
         a.status,
         a.created_at,
         a.updated_at,
         ar.registration_status,
         ar.attendance,
         ar.hours_earned
       FROM activity_registrations ar
       JOIN activities a ON ar.activity_id = a.id
       WHERE ar.user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      message: 'ดึงกิจกรรมที่ลงทะเบียนไว้สำเร็จ',
      activities: rows,
    });
  } catch (error) {
    console.error('getUserRegisteredActivities error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม',
      error: error.message,
    });
  }
};

const getUserProfileWithHours = async (req, res) => {
  const userId = req.params.id;

  try {
    const rows = await queryDb(
      `SELECT 
         u.id,
         u.student_id,
         u.first_name,
         u.last_name,
         u.email,
         u.faculty,
         u.department,
         u.role,
         u.user_status,
         u.volunteer_hours,
         COALESCE(SUM(ar.hours_earned), 0) AS total_hours_earned
       FROM users u
       LEFT JOIN activity_registrations ar ON u.id = ar.user_id AND ar.registration_status = 'completed'
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'ไม่พบผู้ใช้ที่ระบุ'
      });
    }

    const profile = { ...rows[0] };
    delete profile.total_hours_earned;  // ลบ key นี้ออก

    return res.status(200).json({
      message: 'โหลดโปรไฟล์และชั่วโมงกิจกรรมสำเร็จ',
      profile
    });
  } catch (error) {
    console.error('getUserProfileWithHours error:', error);
    return res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์',
      error: error.message
    });
  }
};



module.exports = {
    getParticipants,
    joinActivity,
    getCompletedActivities,
    getUserRegisteredActivities,
    getUserProfileWithHours
};