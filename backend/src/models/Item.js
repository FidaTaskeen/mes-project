const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    unitOfMeasure: {
      type: String,
      required: [true, 'Unit of measure is required'],
      trim: true,
    },
    itemType: {
      type: String,
      enum: ['FG', 'WIP', 'RM'],
      required: [true, 'Item type is required'],
    },
    serialNoLength: {
      type: Number,
      min: 1,
      max: 50,
      default: null,
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

module.exports = mongoose.model('Item', itemSchema);