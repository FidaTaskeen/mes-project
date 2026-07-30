const mongoose = require('mongoose');

const routingStepSchema = new mongoose.Schema(
  {
    operation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      required: [true, 'Operation is required'],
    },
    sequenceNo: {
      type: Number,
      required: [true, 'Sequence number is required'],
      min: [1, 'Sequence number must be at least 1'],
    },
    standardTime: {
      type: Number, // minutes, can override the operation's default
      required: [true, 'Standard time for this step is required'],
      min: [0, 'Standard time cannot be negative'],
    },
  },
  { _id: false }
);

const routingSchema = new mongoose.Schema(
  {
    routingCode: {
      type: String,
      required: [true, 'Routing code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item (product this routing is for) is required'],
    },
    steps: {
      type: [routingStepSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Routing must have at least one operation step',
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

// Ensure sequence numbers are unique within one routing
routingSchema.pre('save', function () {
  const seqs = this.steps.map((s) => s.sequenceNo);
  const hasDuplicates = new Set(seqs).size !== seqs.length;
  if (hasDuplicates) {
    throw new Error('Sequence numbers must be unique within a routing');
  }
});
module.exports = mongoose.model('Routing', routingSchema);