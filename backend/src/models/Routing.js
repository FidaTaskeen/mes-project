const mongoose = require('mongoose');

const routingLineSchema = new mongoose.Schema(
  {
    sequence: {
      type: Number,
      required: true,
    },

    operationCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    operationName: {
      type: String,
      required: true,
      trim: true,
    },

    stage: {
      type: String,
      enum: ['Start', 'Middle', 'End'],
      default: 'Middle',
    },

    previousOperation: {
      type: String,
      default: '',
      trim: true,
    },

    type: {
      type: String,
      enum: ['Automatic', 'Manual', 'Inspection', 'Testing'],
      default: 'Manual',
    },

    scan: {
      type: String,
      default: 'Serial No',
      trim: true,
    },
  },
  { _id: false }
);

const routingSchema = new mongoose.Schema(
  {
    routingNo: {
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

    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      required: true,
    },

    version: {
      type: String,
      default: 'Version 1',
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },

    routingLines: {
      type: [routingLineSchema],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: 'At least one routing operation is required',
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

routingSchema.pre('save', function (next) {
  const seq = this.routingLines.map((r) => r.sequence);

  if (new Set(seq).size !== seq.length) {
    return next(new Error('Sequence numbers must be unique'));
  }

  next();
});

module.exports = mongoose.model('Routing', routingSchema);