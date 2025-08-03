const jwt = require('jsonwebtoken');
const axios = require('axios');

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

// Middleware to verify JWT token and fetch user details
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Handle both "Bearer token" and "token" formats
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details from auth service
    try {
      const userResponse = await axios.get(`${AUTH_SERVICE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
            
      if (userResponse.data.success) {
        // Combine JWT data with user details
        req.user = {
          userId: decoded.id,
          id: decoded.id,
          role: decoded.role,
          ...userResponse.data.user // Full user details from auth service
        };
      } else {
        // Fallback to JWT data only
        req.user = {
          userId: decoded.id,
          id: decoded.id,
          role: decoded.role
        };
      }
    } catch (authServiceError) {
      // Fallback to JWT data only
      req.user = {
        userId: decoded.id,
        id: decoded.id,
        role: decoded.role
      };
    }
    
    next();

  } catch (error) {
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

// Middleware to require specific roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      // Normalize role for case-insensitive comparison
      const userRole = user.role ? user.role.toLowerCase() : '';
      const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role verification failed.',
        error: error.message
      });
    }
  };
};

// Middleware to require admin role
const requireAdmin = requireRole(['Admin']);

// Middleware to require manager or admin role
const requireManagerOrAdmin = requireRole(['Manager', 'Admin']);

// Middleware to validate ObjectId parameters
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const mongoose = require('mongoose');
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Middleware to log requests (for debugging)
const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.get('User-Agent');
  const ip = req.ip;
  
  console.log(`[${timestamp}] ${method} ${url} - ${ip} - ${userAgent}`);
  next();
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin,
  validateObjectId,
  logRequest
};
