
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },

  // Logged-in user ID; null for guest questions
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  authorType: {
    type: String,
    enum: ['user', 'guest'],
    default: 'user',
    required: true
  },

  // Public display name
  authorName: {
    type: String,
    required: true,
    trim: true
  },

  // Private guest information
  guestName: {
    type: String,
    trim: true,
    default: undefined
  },

  guestEmail: {
    type: String,
    trim: true,
    lowercase: true,
    select: false,
    default: undefined
  },

  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },

  // Existing answers remain unchanged
  answers: {
    type: [answerSchema],
    default: []
  }
}, { timestamps: true });

module.exports =
  mongoose.models.Question ||
  mongoose.model('Question', questionSchema);
