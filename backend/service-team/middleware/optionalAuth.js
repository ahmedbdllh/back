const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  // If no token, continue without user
  if (!token) {
    req.user = null;
    return next();
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    req.user = decoded;
    next();
  } catch (err) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
