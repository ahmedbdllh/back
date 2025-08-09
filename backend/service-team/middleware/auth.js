const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');

  console.log(`🔐 AUTH DEBUG: ${req.method} ${req.path}`);
  console.log(`   Authorization header: ${req.header('Authorization')}`);
  console.log(`   x-auth-token header: ${req.header('x-auth-token')}`);
  console.log(`   Final token: ${token ? token.substring(0, 20) + '...' : 'null'}`);

  // Check if not token
  if (!token) {
    console.log(`   ❌ No token provided`);
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    console.log(`   ✅ Token valid, decoded:`, decoded);
    
    // Handle different token formats - some tokens use 'id', others use 'userId'
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id
    };
    
    console.log(`   ✅ Final user ID: ${req.user.userId}`);
    next();
  } catch (err) {
    console.log(`   ❌ Token invalid: ${err.message}`);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
