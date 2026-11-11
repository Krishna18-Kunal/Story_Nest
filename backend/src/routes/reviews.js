
const express = require('express');
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

const valid = (id) => mongoose.Types.ObjectId.isValid(id);

// Public-safe review response.
// Never return guestEmail.
const shape = (r) => ({
  id: r._id?.toString() || '',
  _id: r._id?.toString() || '',
  postId: r.postId?.toString() || null,
  ownerId: r.authorId?.toString() || null,
  authorId: r.authorId?.toString() || null,
  authorType: r.authorType || (r.authorId ? 'user' : 'guest'),
  name: r.authorName || r.guestName || 'Anonymous',
  rating: r.rating,
  comment: r.comment || '',
  createdAt: r.createdAt || null,
  editedAt:
    r.updatedAt &&
    r.createdAt &&
    new Date(r.updatedAt) > new Date(r.createdAt)
      ? r.updatedAt
      : null
});

// GET all reviews - public
router.get('/', async (req, res, next) => {
  try {
    const rows = await Review.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rows.map(shape)
    });
  } catch (error) {
    next(error);
  }
});

// GET reviews for one blog - public
router.get('/post/:postId', async (req, res, next) => {
  try {
    if (!valid(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID.'
      });
    }

    const rows = await Review.find({
      postId: req.params.postId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rows.map(shape)
    });
  } catch (error) {
    next(error);
  }
});

// CREATE review - guest or logged-in user
router.post('/post/:postId', optionalAuth, async (req, res, next) => {
  try {
    if (!valid(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID.'
      });
    }

    const postExists = await Post.exists({
      _id: req.params.postId
    });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.'
      });
    }

    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || '').trim();

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !comment ||
      comment.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: 'A 1-5 star rating and comment (max 500 characters) are required.'
      });
    }

    let reviewData;

    if (req.user) {
      // Logged-in review
      reviewData = {
        postId: req.params.postId,
        authorId: req.user._id,
        authorType: 'user',
        authorName: req.user.name || 'User',
        rating,
        comment
      };
    } else {
      // Guest review
      const guestName = String(req.body.name || '').trim();
      const guestEmail = String(req.body.email || '').trim().toLowerCase();

      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail);

      if (!guestName || guestName.length > 80) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your name (maximum 80 characters).'
        });
      }

      // Email is optional.
      // If provided, it must be valid.
      if (
        guestEmail &&
        (!emailValid || guestEmail.length > 254)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.'
        });
      }

      reviewData = {
        postId: req.params.postId,
        authorId: null,
        authorType: 'guest',
        authorName: guestName,
        guestName,
        ...(guestEmail && { guestEmail }),
        rating,
        comment
      };
    }

    const row = await Review.create(reviewData);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: shape(row)
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this blog. Edit your existing review instead.'
      });
    }

    next(error);
  }
});

// UPDATE own logged-in review only
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.'
      });
    }

    const row = await Review.findById(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    if (
      !row.authorId ||
      row.authorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own logged-in review.'
      });
    }

    const comment = String(req.body.comment || '').trim();

    if (!comment || comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required (max 500 characters).'
      });
    }

    row.comment = comment;

    if (req.body.rating !== undefined) {
      const rating = Number(req.body.rating);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5.'
        });
      }

      row.rating = rating;
    }

    await row.save();

    return res.json({
      success: true,
      data: shape(row)
    });

  } catch (error) {
    next(error);
  }
});

// DELETE own logged-in review only
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID.'
      });
    }

    const row = await Review.findById(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.'
      });
    }

    if (
      !row.authorId ||
      row.authorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own logged-in review.'
      });
    }

    await row.deleteOne();

    return res.json({
      success: true,
      message: 'Review deleted successfully.'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
