const axios = require('axios');

// Middleware to validate JWT tokens with auth service
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }    // Validate token with auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.post(`${authServiceUrl}/api/auth/validate-token`, {
      token
    });

    if (response.data.valid) {
      req.user = response.data.user;
      next();
    } else {
      res.status(403).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.status(500).json({ message: 'Token validation failed' });
    }
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user owns the company or is admin
const requireOwnershipOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Company = require('../models/Company');
    
    const company = await Company.findById(id);
      if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }    // Get user ID - handle both _id and id formats
    const userId = req.user._id || req.user.id;
    
    console.log('=== OWNERSHIP CHECK DEBUG ===');
    console.log('User from token:', { _id: req.user._id, id: req.user.id, role: req.user.role });
    console.log('Company details:', { id: company._id, ownerId: company.ownerId });
    console.log('ownerId type:', typeof company.ownerId);
    console.log('userId type:', typeof userId);
    console.log('Match check:', company.ownerId && userId && company.ownerId.toString() === userId.toString());

    // Allow if user is admin or owns the company
    if (req.user.role === 'Admin' || 
        (company.ownerId && userId && company.ownerId.toString() === userId.toString())) {
      req.company = company;
      next();
    } else {
      res.status(403).json({ message: 'Access denied. You can only modify your own company.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin
};