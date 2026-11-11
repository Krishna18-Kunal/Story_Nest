
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },

  // Logged-in user ID; null for guest reviews
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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

  // Private guest details
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

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// One review per logged-in user per blog.
// Guest reviews are not restricted by this index.
reviewSchema.index(
  { postId: 1, authorId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      authorId: { $type: 'objectId' }
    }
  }
);

module.exports =
  mongoose.models.Review ||
  mongoose.model('Review', reviewSchema);
