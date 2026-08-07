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
      min: 1,
    },
    stage: {
      type: String,
      enum: ['Start', 'Middle', 'End'],
      default: 'Middle',
    },
    previousOperation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      default: null,
    },
    type: {
      type: String,
      enum: ['Scanning', 'No_Scanning'],
      default: 'No_Scanning',
    },
    scan: {
      type: String,
      enum: ['Serial No', 'None'],
      default: 'None',
    },
    standardTime: {
      type: Number,
      default: 0,
      min: 0,
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
      required: true,
    },

    bom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BOM',
      required: [true, 'BOM is required'],
    },

    version: {
      type: String,
      default: 'v1',
      trim: true,
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },

    plant: {
      type: String,
      default: '',
      trim: true,
    },

    shopfloor: {
      type: String,
      default: '',
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    inputItemDescription: {
      type: String,
      default: '',
      trim: true,
    },

    validFrom: {
      type: Date,
    },

    validTo: {
      type: Date,
    },

    firstScanningOperation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      default: null,
    },

    activeOperation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      default: null,
    },

    consumptionOperation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      default: null,
    },

    finalOperation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Operation',
      default: null,
    },

    setupVerification: {
      type: Boolean,
      default: false,
    },

    inventoryValidation: {
      type: Boolean,
      default: false,
    },

    sampleRun: {
      type: Boolean,
      default: false,
    },

    steps: {
      type: [routingStepSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one routing step is required',
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

routingSchema.pre('save', function () {
  const seq = this.steps.map((s) => s.sequenceNo);
  if (new Set(seq).size !== seq.length) {
    throw new Error('Sequence numbers must be unique');
  }
});

module.exports = mongoose.model('Routing', routingSchema);