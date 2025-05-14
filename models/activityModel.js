const activities = [
    {
        id: 1,
        name: 'ปลูกป่าอนุรักษ์ธรรมชาติ',
        description: 'เข้าร่วมปลูกต้นไม้เพื่ออนุรักษ์สิ่งแวดล้อมในพื้นที่ป่าสงวน',
        category: 'อาสา',  // อาสา | ช่วยงาน | อบรม
        startDate: '2025-06-01T09:00:00',
        endDate: '2025-06-01T16:00:00',
        maxParticipants: 50,
        participants: [],
        status: 'approved'  // pending | approved | rejected
    },
    {
        id: 2,
        name: 'อบรมการเขียน Resume ให้โดนใจ',
        description: 'กิจกรรมอบรมเพื่อเตรียมความพร้อมในการสมัครงาน',
        category: 'อบรม',
        startDate: '2025-06-10T13:00:00',
        endDate: '2025-06-10T15:00:00',
        maxParticipants: 100,
        participants: [],
        status: 'pending'
    },
    {
        id: 3,
        name: 'ช่วยงานจัดบูธกิจกรรม Open House',
        description: 'นิสิตช่วยงานอำนวยความสะดวกในงาน Open House ของมหาวิทยาลัย',
        category: 'ช่วยงาน',
        startDate: '2025-07-05T08:00:00',
        endDate: '2025-07-05T17:00:00',
        maxParticipants: 30,
        participants: [],
        status: 'approved'
    }
];

module.exports = activities;
