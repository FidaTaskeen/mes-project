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

    sequenceNo: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
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