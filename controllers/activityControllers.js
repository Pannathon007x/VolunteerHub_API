const activities = require('../models/activityModel');


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

module.exports = { createActivity };
