const mongoose = require('mongoose');

const routingStepSchema = new mongoose.Schema(
  {
    operation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    sequenceNo: { type: Number, required: true, min: 1 },
    stage: { type: String, enum: ['Start', 'Middle', 'End'], default: 'Middle' },
    previousOperation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', default: null },
    type: { type: String, enum: ['Scanning', 'No_Scanning'], default: 'No_Scanning' },
    scan: { type: String, enum: ['Serial No', 'None'], default: 'None' },
  },
  { _id: false }
);

const routingSchema = new mongoose.Schema(
  {
    routingCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    bom: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM', required: true },
    version: { type: String, default: 'Version 1', trim: true },
    firstScanOperation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    lastScanOperation: { type: mongoose.Schema.Types.ObjectId, ref: 'Operation', required: true },
    steps: {
      type: [routingStepSchema],
      validate: { validator: (a) => a.length > 0, message: 'Routing must have at least one operation step' },
    },
    status: { type: String, enum: ['Active', 'Draft', 'Inactive'], default: 'Active' },
    description: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

routingSchema.pre('save', function () {
  const seqs = this.steps.map((s) => s.sequenceNo);
  if (new Set(seqs).size !== seqs.length) {
    throw new Error('Sequence numbers must be unique within a routing');
  }
});

module.exports = mongoose.model('Routing', routingSchema);