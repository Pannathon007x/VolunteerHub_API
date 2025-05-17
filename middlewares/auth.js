const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];


  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Unauthorized.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }


    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next(); 
  });
};

module.exports = verifyToken;
