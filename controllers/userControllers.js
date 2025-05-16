
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
    const { userId } = req.body;

    const activityId = parseInt(id);

    try {
        // ตรวจสอบว่ากิจกรรมมีอยู่จริงหรือไม่
        const activityRows = await queryDb('SELECT * FROM activities WHERE id = ?', [activityId]);

        if (activityRows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
        }
        const activity = activityRows[0];

        // ตรวจสอบว่าผู้ใช้สมัครไปแล้วหรือยัง
        const registrationRows = await queryDb(
            'SELECT * FROM activity_registrations WHERE activity_id = ? AND user_id = ?',
            [activityId, userId]
        );

        if (registrationRows.length > 0) {
            return res.status(400).json({ message: 'คุณสมัครเข้าร่วมกิจกรรมนี้ไปแล้ว' });
        }

        // ตรวจสอบจำนวนผู้เข้าร่วม
        const participantsCountRows = await queryDb(
            'SELECT COUNT(*) AS count FROM activity_registrations WHERE activity_id = ?',
            [activityId]
        );

        const participantsCount = participantsCountRows[0].count;

        if (participantsCount >= activity.max_participants) {
            return res.status(400).json({ message: 'กิจกรรมเต็มแล้ว' });
        }

        // เพิ่มข้อมูลผู้เข้าร่วมใหม่
        await queryDb(
            `INSERT INTO activity_registrations 
            (activity_id, user_id, registration_status, registration_date, updated_at) 
            VALUES (?, ?, 'pending', NOW(), NOW())`,
            [activityId, userId]
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



module.exports = {
    getParticipants,
    joinActivity
};