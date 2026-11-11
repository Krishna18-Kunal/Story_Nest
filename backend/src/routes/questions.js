
const express = require('express');
const mongoose = require('mongoose');

const Question = require('../models/Question');
const Post = require('../models/Post');

const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

const valid = id => mongoose.Types.ObjectId.isValid(id);

const shapeAnswer = a => ({
  id: a._id.toString(),
  ownerId: a.authorId.toString(),
  name: a.authorName,
  text: a.text,
  createdAt: a.createdAt,
  editedAt: a.updatedAt > a.createdAt ? a.updatedAt : null
});

const shape = q => ({
  id: q._id.toString(),
  _id: q._id.toString(),
  postId: q.postId.toString(),
  ownerId: q.authorId ? q.authorId.toString() : null,
  authorType: q.authorType || (q.authorId ? 'user' : 'guest'),
  name: q.authorName || q.guestName || 'Anonymous',
  text: q.text,
  createdAt: q.createdAt,
  editedAt: q.updatedAt > q.createdAt ? q.updatedAt : null,
  answers: (q.answers || []).map(shapeAnswer)
});

// GET all questions - public
router.get('/', async (req, res, next) => {
  try {
    const rows = await Question.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rows.map(shape)
    });
  } catch (e) {
    next(e);
  }
});

// GET questions for a blog - public
router.get('/post/:postId', async (req, res, next) => {
  try {
    if (!valid(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID.'
      });
    }

    const rows = await Question.find({
      postId: req.params.postId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rows.map(shape)
    });
  } catch (e) {
    next(e);
  }
});

// POST question - guest and logged-in users
router.post('/post/:postId', optionalAuth, async (req, res, next) => {
  try {
    if (!valid(req.params.postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID.'
      });
    }

    if (!await Post.exists({ _id: req.params.postId })) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found.'
      });
    }

    const text = String(req.body.text || '').trim();

    if (!text || text.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Question is required (max 300 characters).'
      });
    }

    let questionData;

    if (req.user) {
      questionData = {
        postId: req.params.postId,
        authorId: req.user._id,
        authorType: 'user',
        authorName: req.user.name,
        text
      };
    } else {
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();

      if (name.length < 2 || name.length > 80) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 80 characters.'
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address.'
        });
      }

      questionData = {
        postId: req.params.postId,
        authorId: null,
        authorType: 'guest',
        authorName: name,
        guestName: name,
        guestEmail: email,
        text
      };
    }

    const q = await Question.create(questionData);

    res.status(201).json({
      success: true,
      data: shape(q)
    });
  } catch (e) {
    next(e);
  }
});

// EDIT question - logged-in owner only
router.put('/:id', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID.'
      });
    }

    const q = await Question.findById(req.params.id);

    if (!q) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    if (!q.authorId || q.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own question.'
      });
    }

    const text = String(req.body.text || '').trim();

    if (!text || text.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Question is required (max 300 characters).'
      });
    }

    q.text = text;
    await q.save();

    res.json({
      success: true,
      data: shape(q)
    });
  } catch (e) {
    next(e);
  }
});

// DELETE question - logged-in owner only
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID.'
      });
    }

    const q = await Question.findById(req.params.id);

    if (!q) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    if (!q.authorId || q.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own question.'
      });
    }

    await q.deleteOne();

    res.json({
      success: true,
      message: 'Question and its answers deleted.'
    });
  } catch (e) {
    next(e);
  }
});

// POST answer - login required
router.post('/:id/answers', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question ID.'
      });
    }

    const q = await Question.findById(req.params.id);

    if (!q) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    const text = String(req.body.text || '').trim();

    if (!text || text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required (max 1000 characters).'
      });
    }

    q.answers.push({
      authorId: req.user._id,
      authorName: req.user.name,
      text
    });

    await q.save();

    res.status(201).json({
      success: true,
      data: shape(q)
    });
  } catch (e) {
    next(e);
  }
});

// EDIT answer - answer owner only
router.put('/:id/answers/:answerId', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id) || !valid(req.params.answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID.'
      });
    }

    const q = await Question.findById(req.params.id);

    if (!q) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    const a = q.answers.id(req.params.answerId);

    if (!a) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found.'
      });
    }

    if (a.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can edit only your own answer.'
      });
    }

    const text = String(req.body.text || '').trim();

    if (!text || text.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Answer is required (max 1000 characters).'
      });
    }

    a.text = text;
    await q.save();

    res.json({
      success: true,
      data: shape(q)
    });
  } catch (e) {
    next(e);
  }
});

// DELETE answer - answer owner only
router.delete('/:id/answers/:answerId', auth, async (req, res, next) => {
  try {
    if (!valid(req.params.id) || !valid(req.params.answerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID.'
      });
    }

    const q = await Question.findById(req.params.id);

    if (!q) {
      return res.status(404).json({
        success: false,
        message: 'Question not found.'
      });
    }

    const a = q.answers.id(req.params.answerId);

    if (!a) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found.'
      });
    }

    if (a.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own answer.'
      });
    }

    a.deleteOne();
    await q.save();

    res.json({
      success: true,
      data: shape(q)
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
