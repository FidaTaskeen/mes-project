const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ['Keyboard', 'Mouse', 'Printer', 'Scanner', 'PCB', 'Raw Material'],
      required: true,
    },

    uom: {
      type: String,
      default: 'Nos',
    },

    description: {
      type: String,
      required: true,
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