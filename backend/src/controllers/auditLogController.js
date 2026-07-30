const AuditLog = require('../models/AuditLog');

// @route  GET /api/audit-logs  (supports ?module=&action=&user=&page=&limit=)
exports.getAuditLogs = async (req, res) => {
  try {
    const { module, action, user, page = 1, limit = 30 } = req.query;

    const filter = {};
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (user) filter.user = user;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(filter);

    res.status(200).json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Get audit logs error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};