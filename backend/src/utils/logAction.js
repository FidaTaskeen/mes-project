const AuditLog = require('../models/AuditLog');

// Call this anywhere: logAction(userId, 'CREATE', 'Item', 'Created item RM001', itemId)
const logAction = async (userId, action, module, description, targetId = null) => {
  try {
    await AuditLog.create({ user: userId, action, module, description, targetId });
  } catch (err) {
    // Never let a logging failure break the actual request
    console.error('Audit log error:', err.message);
  }
};

module.exports = logAction;