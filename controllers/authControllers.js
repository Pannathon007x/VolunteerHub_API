const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const users = require('../models/userModel'); // Mock database

// Register API
const register = async (req, res) => {
    const { email, password, name } = req.body;


    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password and name are required' });
    }


    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const role = users.length === 0 ? 'admin' : 'user';


    const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        name,
        role
    };

    users.push(newUser); 

    return res.status(201).json({
        message: `User registered successfully as ${role}`,
        user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role }
    });
};

// Login API
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }


    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }


    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }


    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        'your_jwt_secret_key',
        { expiresIn: '1h' }  
    );

    return res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    });
};

module.exports = { register, login };
