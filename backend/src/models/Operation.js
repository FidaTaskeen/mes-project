const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    operationCode: {
      type: String,
      required: [true, 'Operation code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    operationName: {
      type: String,
      required: [true, 'Operation name is required'],
      trim: true,
    },
    workCenter: {
      type: String,
      required: [true, 'Work center / department is required'],
      trim: true,
    },
    standardTime: {
      type: Number, // in minutes
      required: [true, 'Standard time is required'],
      min: [0, 'Standard time cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Operation', operationSchema);