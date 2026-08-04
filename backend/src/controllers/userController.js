const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-password')
      .populate('assignedOperations', 'operationCode operationName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedOperations', 'operationCode operationName');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, userId, email, password, role, assignedOperations } = req.body;

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
      assignedOperations: assignedOperations || [],
    });

    const populated = await user.populate('assignedOperations', 'operationCode operationName');

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: populated._id,
        name: populated.name,
        userId: populated.userId,
        email: populated.email,
        role: populated.role,
        status: populated.status,
        assignedOperations: populated.assignedOperations,
      },
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, userId, email, role, status, assignedOperations } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userId && userId.toLowerCase() !== user.userId) {
      const existingUserId = await User.findOne({ userId: userId.toLowerCase() });
      if (existingUserId) {
        return res.status(409).json({ message: 'This User ID is already taken' });
      }
      user.userId = userId.toLowerCase();
    }

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ message: 'Another account already uses this email' });
      }
      user.email = email.toLowerCase();
    }

    user.name = name ?? user.name;
    user.role = role ?? user.role;
    user.status = status ?? user.status;
    if (assignedOperations !== undefined) {
      user.assignedOperations = assignedOperations;
    }

    await user.save();
    const populated = await user.populate('assignedOperations', 'operationCode operationName');

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: populated._id,
        name: populated.name,
        userId: populated.userId,
        email: populated.email,
        role: populated.role,
        status: populated.status,
        assignedOperations: populated.assignedOperations,
      },
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await user.deleteOne();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};