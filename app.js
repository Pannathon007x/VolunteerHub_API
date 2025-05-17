const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/activity', activityRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
