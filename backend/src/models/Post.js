const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 160,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
  },
  author: {
    type: String,
    trim: true,
    default: 'Niranjan Kumar',
  },
  // Optional reference to a User document from Sprint 10.
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Store only the URL, never the image bytes/base64.
  imageUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.models.Post || mongoose.model('Post', postSchema);
