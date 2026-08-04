const mongoose = require('mongoose');

const bomComponentSchema = new mongoose.Schema(
  {
    componentItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },

    uom: {
      type: String,
      required: true,
      default: 'Nos',
    },
  },
  { _id: false }
);

const bomSchema = new mongoose.Schema(
  {
    bomNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },

    version: {
      type: String,
      default: 'V1',
    },

    components: {
      type: [bomComponentSchema],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'At least one BOM component is required',
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