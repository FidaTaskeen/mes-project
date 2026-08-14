const mongoose = require('mongoose');

const jobOrderSchema = new mongoose.Schema(
  {
    jobOrderNo: {
      type: String,
      required: [true, 'Job order number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item is required'],
    },
    routing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routing',
      required: [true, 'Routing is required'],
    },
    routingVersion: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    completedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejectQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Planned', 'Released', 'On Hold', 'In Progress', 'Completed'],
      default: 'Planned',
    },
    currentOperationIndex: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobOrder', jobOrderSchema);