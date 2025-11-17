const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String
  },

  date: {
    type: Date,
    required: true
  },

  festType: {
    type: String,
    enum: ['Nimbus', "Hill'ffair"],
    required: true
  },

  // 🔹 NEW: every event belongs to a club
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },

  // who created the event (usually coordinator or super admin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  registrationDeadline: {
    type: Date,
    required: true
  },

  // optional capacity for registrations
  maxSeats: {
    type: Number,
    default: null
  },

  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  checkedInUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, { timestamps: true });

/**
 * Helpful index for filters like:
 * - all events of a fest
 * - upcoming events sorted by date
 */
eventSchema.index({ festType: 1, date: 1 });

module.exports = mongoose.model('Event', eventSchema);
