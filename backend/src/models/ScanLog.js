const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    jobOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', required: true },
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    serialId: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pass', 'Fail'], required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ScanLog', scanLogSchema);