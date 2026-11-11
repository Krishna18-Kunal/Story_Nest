const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.storynest_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7) : null);
    if (!token) return res.status(401).json({ success: false, message: 'Please log in to continue.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('_id name email');
    if (!user) return res.status(401).json({ success: false, message: 'Account not found. Please log in again.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Your session is invalid or expired. Please log in again.' });
  }
};
