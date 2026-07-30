const mongoose = require('mongoose');

const bomComponentSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Component item is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be greater than 0'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
  },
  { _id: false }
);

const bomSchema = new mongoose.Schema(
  {
    bomCode: {
      type: String,
      required: [true, 'BOM code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    parentItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Parent item (finished/WIP item this BOM builds) is required'],
    },
    version: {
      type: String,
      default: 'v1',
      trim: true,
    },
    components: {
      type: [bomComponentSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'BOM must have at least one component',
      },
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

module.exports = mongoose.model('BOM', bomSchema);