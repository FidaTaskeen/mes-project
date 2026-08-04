const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      userId: user.userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register user (Admin creates users)
exports.register = async (req, res) => {
  try {
    const { userId, name, password, role } = req.body;

    if (!userId || !name || !password || !role) {
      return res.status(400).json({
        message: 'User ID, Name, Password, and Role are required',
      });
    }

    const existingUser = await User.findOne({
      userId: userId.toUpperCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'User ID already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId: userId.toUpperCase(),
      name,
      password: hashedPassword,
      role,
      status: 'active',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Login with User ID
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        message: 'User ID and Password are required',
      });
    }

    const user = await User.findOne({
      userId: userId.toUpperCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid User ID or Password',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'User is inactive',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid User ID or Password',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      message: 'Something went wrong. Please try again.',
    });
  }
};

// Current logged-in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({
      message: 'Something went wrong. Please try again.',
    });
  }
};