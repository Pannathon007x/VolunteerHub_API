const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
// auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);
// activity routes
const activityRoutes = require('./routes/activityRoutes');
app.use('/activity', activityRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Hello World');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
