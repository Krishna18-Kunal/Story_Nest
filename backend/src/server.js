require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server tools (curl/Postman) without an Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sprint 11 Blog API is running!',
    endpoints: ['GET /posts', 'GET /posts/recent/top', 'GET /posts/:id',
      'POST /posts', 'PUT /posts/:id', 'DELETE /posts/:id'],
  });
});

app.get('/health', (req, res) => res.json({ success: true, status: 'healthy' }));
app.use('/posts', postsRouter);

// Preserve the existing Sprint 10 users route if it exists.
try {
  const usersRouter = require('./routes/users');
  app.use('/users', usersRouter);
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  console.warn('Optional /users route not found; continuing without it.');
}

app.use((err, req, res, next) => {
  console.error(err.stack || err);
  if (err.message && err.message.startsWith('CORS blocked origin:')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

async function start() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing. Add it to your .env file or Render environment variables.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Atlas connected successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Blog API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

start();
