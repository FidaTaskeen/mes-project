const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, userId: user.userId },
    process.env.JWT_SECRET
    // no expiresIn = token never expires (intentional for internal company use)
  );
};

// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, userId, email, password, role } = req.body;

    if (!name || !userId || !password) {
      return res.status(400).json({ message: 'Name, User ID, and password are required' });
    }

    const existingUserId = await User.findOne({ userId: userId.toLowerCase() });
    if (existingUserId) {
      return res.status(409).json({ message: 'This User ID is already taken' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      userId: userId.toLowerCase(),
      email: email ? email.toLowerCase() : undefined,
      password: hashedPassword,
      role: role || 'operator',
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const identifier = userId.toLowerCase();
    const user = await User.findOne({
      $or: [{ userId: identifier }, { email: identifier }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid User ID or password' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'This account has been deactivated. Contact your admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid User ID or password' });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('assignedOperations', 'operationCode operationName');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};