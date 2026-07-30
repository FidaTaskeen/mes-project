const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'My Company',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    dateFormat: {
      type: String,
      default: 'DD-MM-YYYY',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);