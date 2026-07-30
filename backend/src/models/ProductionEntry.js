const mongoose = require('mongoose');

const productionEntrySchema = new mongoose.Schema(
  {
    jobOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOrder',
      required: [true, 'Job order is required'],
    },
    operation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      required: [true, 'Operation is required'],
    },
    sequenceNo: {
      type: Number,
      required: [true, 'Sequence number is required'],
    },
    goodQty: {
      type: Number,
      required: [true, 'Good quantity is required'],
      min: [0, 'Good quantity cannot be negative'],
      default: 0,
    },
    rejectQty: {
      type: Number,
      min: [0, 'Reject quantity cannot be negative'],
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductionEntry', productionEntrySchema);