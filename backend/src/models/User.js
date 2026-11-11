
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254
  },

  // Password is optional for Google users.
  // Existing email/password accounts remain supported.
  passwordHash: {
    type: String,
    select: false,
    default: undefined
  },

  // Google account's unique ID.
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },

  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports =
  mongoose.models.User || mongoose.model('User', userSchema);
