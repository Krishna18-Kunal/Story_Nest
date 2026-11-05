const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const Post = require('../models/Post');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed.'));
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sprint11-blog-thumbnails', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

function validateId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID.' });
  }
  next();
}

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) { next(error); }
});

router.get('/recent/top', async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(3);
    res.json({ success: true, count: posts.length, data: posts });
  } catch (error) { next(error); }
});

router.get('/:id', validateId, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, data: post });
  } catch (error) { next(error); }
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    const { title, content, author, authorId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    let imageUrl = '';
    if (req.file) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({ success: false, message: 'Image upload is not configured on the server.' });
      }
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploaded.secure_url;
    }

    const post = await Post.create({
      title: title.trim(),
      content: content.trim(),
      author: author || 'Niranjan Kumar',
      authorId: authorId && mongoose.Types.ObjectId.isValid(authorId) ? authorId : null,
      imageUrl,
    });
    res.status(201).json({ success: true, message: 'Post created successfully.', data: post });
  } catch (error) { next(error); }
});

router.put('/:id', validateId, upload.single('image'), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    if (req.body.title !== undefined) post.title = req.body.title.trim();
    if (req.body.content !== undefined) post.content = req.body.content.trim();
    if (req.body.author !== undefined) post.author = req.body.author.trim();

    if (req.file) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(503).json({ success: false, message: 'Image upload is not configured on the server.' });
      }
      const uploaded = await uploadBufferToCloudinary(req.file.buffer);
      post.imageUrl = uploaded.secure_url;
    }
    await post.save();
    res.json({ success: true, message: 'Post updated successfully.', data: post });
  } catch (error) { next(error); }
});

router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted successfully.', data: post });
  } catch (error) { next(error); }
});

module.exports = router;
