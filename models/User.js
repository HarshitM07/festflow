const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'COORDINATOR', 'USER'],
    default: 'USER'
  },

  // Only needed for coordinators and can be null for others
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    default: null
  },

  mustChangePassword: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

/**
 * Ensure that only ONE SUPER_ADMIN exists in the system.
 * If anyone tries to create a second SUPER_ADMIN,
 * MongoDB will throw a duplicate key error.
 */
userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: 'SUPER_ADMIN' } }
);

module.exports = mongoose.model('User', userSchema);
