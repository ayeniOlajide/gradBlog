const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { ACCESS_TOKEN_SECRET } = process.env;

// Ensure the secret key is set in environment
if (!ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET is not defined.');
}

const verifyToken = async (req, res, next) => {
  try {
    // Extract token from cookies or headers
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ status: false, message: 'No token provided.' });
    }

    // Decode and verify token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    // Find the user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ status: false, message: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ status: false, message: 'Token expired.' });
    }
    return res.status(403).json({ status: false, message: 'Invalid token.' });
  }
};

module.exports = verifyToken;
