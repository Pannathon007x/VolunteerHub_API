const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Routes
// auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);
// activity routes
const activityRoutes = require('./routes/activityRoutes');
app.use('/activity', activityRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
