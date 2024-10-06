const router = require('express').Router();
const { register, login, logout } = require('../controllers/authController');
const { redisCachingMiddleware }  = require('../helpers/redis')

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Route for user logout
router.post('/logout', logout);

module.exports = router;
