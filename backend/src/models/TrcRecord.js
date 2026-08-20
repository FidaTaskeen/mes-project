const mongoose = require('mongoose');

// Created the moment an operator scans Fail. Tracks the unit through the
// TRC (rework) lifecycle: Pending -> CheckedIn -> CheckedOut(Pass/Fail).
const trcRecordSchema = new mongoose.Schema(
  {
    jobOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true }, // where it failed
    serialId: { type: String, required: true },

    // captured by the operator at the moment of Fail
    defect: { type: String, required: true },
    defectLocation: { type: String, required: true },
    failedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    failedAt: { type: Date, default: Date.now },

    status: { type: String, enum: ['Pending', 'CheckedIn', 'CheckedOut'], default: 'Pending' },

    checkIn: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
    },

    checkOut: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
      result: { type: String, enum: ['Pass', 'Fail'] },
      trcDefect: String,
      trcDefectLocation: String,
      repairRemarks: String,
      rootCause: String,
    },

    reworked: { type: Boolean, default: false }, // true once checked out as Pass
  },
  { timestamps: true }
);

module.exports = mongoose.model('TrcRecord', trcRecordSchema);