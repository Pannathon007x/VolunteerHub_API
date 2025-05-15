const activities = require('../models/activityModel');

// Create Activity
const createActivity = (req, res) => {
    const { name, description, category, startDate, endDate, maxParticipants } = req.body;

    // Validation
    if (!name || !description || !category || !startDate || !endDate || !maxParticipants) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const newActivity = {
        id: activities.length + 1,
        name,
        description,
        category,
        startDate,
        endDate,
        maxParticipants,
        participants: [],
        status: 'pending'
    };

    activities.push(newActivity);

    return res.status(201).json({
        message: 'สร้างกิจกรรมสำเร็จ',
        activity: newActivity
    });
};

// Get All Activities (Filter + Pagination)
const getAllActivities = (req, res) => {
    const { page = 1, limit = 10, category, status } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let filteredActivities = activities;

    if (category) {
        filteredActivities = filteredActivities.filter(act => act.category === category);
    }

    if (status) {
        filteredActivities = filteredActivities.filter(act => act.status === status);
    }

    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    res.json({
        total: filteredActivities.length,
        page: pageNum,
        limit: limitNum,
        data: paginatedActivities
    });
};

// Get activity by ID
const getActivityById = (req, res) => {
    const { id } = req.params;
    const activityId = parseInt(id);

    const activity = activities.find(act => act.id === activityId);

    if (!activity) {
        return res.status(404).json({ message: 'ไม่พบกิจกรรมที่ระบุ' });
    }

    res.json(activity);
};


module.exports = {
    createActivity,
    getAllActivities,
    getActivityById
};
