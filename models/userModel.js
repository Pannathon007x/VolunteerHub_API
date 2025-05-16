const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = [
    {
        id: 1,
        email: 'admin@gmail.com',
        password: 'admin1234', 
        name: 'Admin User',
        role: 'admin'  
    },
    
];

module.exports = users;
