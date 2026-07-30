const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String, // e.g. 'CREATE', 'UPDATE', 'DELETE'
      required: true,
    },
    module: {
      type: String, // e.g. 'Item', 'JobOrder', 'User'
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);