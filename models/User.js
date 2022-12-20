const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    maxlength: 25,
    required: [true, 'Please provide username'],
  },
  exercise: {
    type: mongoose.Types.ObjectId,
    ref: 'Exercise',
  },
});

module.exports = mongoose.model('User', userSchema);
