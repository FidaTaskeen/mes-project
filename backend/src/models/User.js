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
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'operator'],
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