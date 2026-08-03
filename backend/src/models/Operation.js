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
      type: Number,
      required: [true, 'Standard time is required'],
      min: [0, 'Standard time cannot be negative'],
    },
    plant: {
      type: String,
      trim: true,
      default: '',
    },
    shopfloor: {
      type: String,
      trim: true,
      default: '',
    },
    machineGroup: {
      type: String,
      trim: true,
      default: '',
    },
    routingType: {
      type: String,
      enum: ['Direct Checkout', 'Check In/Out', 'Standard'],
      default: 'Direct Checkout',
    },
    operationRank: {
      type: String,
      trim: true,
      default: '',
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