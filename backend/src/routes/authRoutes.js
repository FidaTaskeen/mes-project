const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// Login using User ID
router.post('/login', login);

// Current logged-in user
router.get('/me', protect, getMe);

// User creation (Admin portal)
router.post('/register', protect, register);

module.exports = router;