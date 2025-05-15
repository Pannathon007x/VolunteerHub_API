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

// Create Activity
const createActivity = async (req, res) => {
    const {
        title,
        description,
        category,       // ใช้เป็น activity_type_id
        startDate,
        endDate,
        location,
        maxParticipants,
        hourValue,
        creatorId
    } = req.body;

    // Validation
    if (!title || !description || !category || !startDate || !endDate || !location || !maxParticipants || !hourValue || !creatorId) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const result = await queryDb(
            `INSERT INTO activities 
            (title, description, activity_type_id, start_datetime, end_datetime, location, max_participants, hour_value, creator_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, category, startDate, endDate, location, maxParticipants, hourValue, creatorId]
        );

        res.status(201).json({
            message: 'สร้างกิจกรรมสำเร็จ',
            activity: {
                id: result.insertId,    // ได้ id จาก database จริง
                title,
                description,
                activity_type_id: category,
                start_datetime: startDate,
                end_datetime: endDate,
                location,
                max_participants: maxParticipants,
                hour_value: hourValue,
                creator_id: creatorId
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม', error: error.message });
    }
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


module.exports = {
    createActivity,
    getAllActivities,
    getActivityById
};
