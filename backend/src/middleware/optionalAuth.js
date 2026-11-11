
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.storynest_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    // Guest visitor: allow request without login
    if (!token) {
      req.user = null;
      return next();
    }

    // Logged-in visitor: verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub)
      .select('_id name email');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please log in again.'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Your session is invalid or expired. Please log in again.'
    });
  }
};
