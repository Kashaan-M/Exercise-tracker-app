const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  description: {
    type: String,
    maxlength: 150,
    required: [true, 'Please provide exercise description'],
  },
  duration: {
    type: Number,
    max: 180,
    required: [true, 'Please provide exercise duration'],
  },
  date: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model('Exercise', exerciseSchema);
