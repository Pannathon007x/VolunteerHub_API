const activities = require('../models/activityModel');
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

// Create Activity (บันทึกลงฐานข้อมูล)
const createActivity = async (req, res) => {
    const { title, description, activity_type_id, start_datetime, end_datetime, location, max_participants, creator_id } = req.body;

    // Validation
    if (!title || !description || !activity_type_id || !start_datetime || !end_datetime || !location || !max_participants || !creator_id) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const result = await queryDb(
            `INSERT INTO activities 
            (title, description, activity_type_id, start_datetime, end_datetime, location, max_participants, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [title, description, activity_type_id, start_datetime, end_datetime, location, max_participants]
        );

        return res.status(201).json({
            message: 'สร้างกิจกรรมสำเร็จ',
            activityId: result.insertId
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล' });
    }
};

// Get All Activities (Filter + Pagination)
const getAllActivities = async (req, res) => {
    const { page = 1, limit = 10, category, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    try {

        let whereClauses = [];
        let values = [];

        if (category) {
            whereClauses.push('activity_type_id = ?');
            values.push(category);
        }

        if (status) {
            whereClauses.push('status = ?');
            values.push(status);
        }

        const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const countResult = await queryDb(`SELECT COUNT(*) AS total FROM activities ${whereSql}`, values);
        const total = countResult[0].total;


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
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// Get Activity by ID (จากฐานข้อมูลจริง)
const getActivityById = async (req, res) => {
    const { id } = req.params;

    try {
        const results = await queryDb('SELECT * FROM activities WHERE id = ?', [id]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
        }

        res.json(results[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
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
const joinActivity = (req, res) => {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const activityId = parseInt(id);

    const activity = activities.find(act => act.id === activityId);

    if (!activity) {
        return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
    }


    if (activity.participants.length >= activity.maxParticipants) {
        return res.status(400).json({ message: 'กิจกรรมเต็มแล้ว' });
    }

 
    const isAlreadyJoined = activity.participants.find(p => p.userId === userId);
    if (isAlreadyJoined) {
        return res.status(400).json({ message: 'คุณสมัครเข้าร่วมกิจกรรมนี้ไปแล้ว' });
    }


    activity.participants.push({ userId, userName });

    res.json({
        message: 'สมัครเข้าร่วมกิจกรรมสำเร็จ',
        activityId: activity.id,
        participantsCount: activity.participants.length
    });
};

module.exports = {
    createActivity,
    getAllActivities,
    getActivityById,
    getParticipants,
    joinActivity
};
