const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    jobOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: true,
    },
    operation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      required: true,
    },
    serialId: {
      type: String,
      required: [true, 'Serial ID is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent the same serial being scanned twice at the same operation
scanLogSchema.index({ jobOrder: 1, operation: 1, serialId: 1 }, { unique: true });

module.exports = mongoose.model('ScanLog', scanLogSchema);