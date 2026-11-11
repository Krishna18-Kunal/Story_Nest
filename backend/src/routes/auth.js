
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

const COOKIE_NAME = 'storynest_token';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});

const publicUser = user => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || ''
});

function issueSession(user, res) {
  const token = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie(COOKIE_NAME, token, cookieOptions());
}

// REGISTER WITH EMAIL AND PASSWORD
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 60 characters.'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    if (await User.exists({ email })) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash
    });

    issueSession(user, res);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    next(error);
  }
});

// LOGIN WITH EMAIL AND PASSWORD
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email }).select('+passwordHash');

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect.'
      });
    }

    issueSession(user, res);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

// LOGIN OR REGISTER WITH GOOGLE
router.post('/google', async (req, res, next) => {
  try {
    const credential = String(req.body.credential || '');

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Google login is not configured on the server.'
      });
    }

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is missing.'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: 'Google account could not be verified.'
      });
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();

    let user = await User.findOne({ googleId });

    // Link an existing email account to Google when the
    // verified Google email matches and no other Google ID is linked.
    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          return res.status(409).json({
            success: false,
            message: 'This email is linked to another Google account.'
          });
        }

        user.googleId = googleId;

        if (!user.profileImage && payload.picture) {
          user.profileImage = payload.picture;
        }

        await user.save();
      } else {
        const name = String(
          payload.name || email.split('@')[0]
        ).trim().slice(0, 60) || 'Google User';

        user = await User.create({
          name,
          email,
          googleId,
          profileImage: payload.picture || ''
        });
      }
    }

    issueSession(user, res);

    res.json({
      success: true,
      message: 'Google login successful.',
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This account is already registered.'
      });
    }

    if (
      error.name === 'Error' ||
      error.message?.includes('Token used too late') ||
      error.message?.includes('Invalid token')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed. Please try again.'
      });
    }

    next(error);
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: undefined
  });

  res.json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// CURRENT USER
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
});

module.exports = router;
