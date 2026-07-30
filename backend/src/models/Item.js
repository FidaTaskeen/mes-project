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
      trim: true, // e.g. PCS, KG, LTR, MTR
    },
    itemType: {
      type: String,
      enum: ['FG', 'WIP', 'RM'], // Finished Good, Work in Progress, Raw Material
      required: [true, 'Item type is required'],
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