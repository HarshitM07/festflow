const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  date: Date,
  festType: {
  type: String,
  enum: ['Nimbus', "Hill'ffair"], // ✅ Capitalized values
  required: true
}
,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registrationDeadline: {
  type: Date,
  required: true
},

  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  checkedInUsers: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}],

}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
