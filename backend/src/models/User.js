const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'operator', 'rework'],
      default: 'operator',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    assignedOperations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operation',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);