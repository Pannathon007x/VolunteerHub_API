const bcrypt = require('bcrypt');


const hashedAdminPass = bcrypt.hashSync('admin41299', 10);  // admin password
const hashedUserPass = bcrypt.hashSync('userpass123', 10);    // user password
 
const users = [
    {
        id: 1,
        email: 'byte9022@gmail.com',
        password: hashedAdminPass,  // hashed password
        name: 'Admin User',
        role: 'admin'  // admin role
    },
    {
        id: 2,
        email: 'byte41299@gmail.com',
        password: hashedUserPass,  // hashed password
        name: 'Regular User',
        role: 'user'  // user role
    }
];

module.exports = users;
