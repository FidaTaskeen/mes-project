const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema(
  {
    operationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    operationName: {
      type: String,
      required: true,
      trim: true,
    },

    workCenter: {
      type: String,
      required: true,
      trim: true,
    },

    standardTime: {
      type: Number,
      required: true,
      min: 0,
    },

    plant: {
      type: String,
      default: '',
      trim: true,
    },

    shopfloor: {
      type: String,
      default: '',
      trim: true,
    },

    machineGroup: {
      type: String,
      default: '',
      trim: true,
    },

    routingType: {
      type: String,
      enum: ['Direct Checkout', 'Check In/Out', 'Standard'],
      default: 'Direct Checkout',
    },

    operationRank: {
      type: String,
      default: '',
      trim: true,
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