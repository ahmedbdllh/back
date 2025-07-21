const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || '7d2260dd33822b6d8c53b068ded2719aa13cfdd279ff0f114da3c4b063e61708';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Verify user exists in auth service
const verifyUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { Authorization: token }
    });

    if (response.data.success) {
      // Ensure userId is set from the user data
      req.user = { 
        ...req.user, 
        ...response.data.user,
        userId: response.data.user.id || response.data.user._id
      };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'User verification failed.'
      });
    }
  } catch (error) {
    console.error('User verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'User verification failed.'
    });
  }
};

// Check if user is company manager
const isCompanyManager = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:5001';
    
    const token = req.header('Authorization');
    const response = await axios.get(`${COMPANY_SERVICE_URL}/api/companies/${companyId}`, {
      headers: { Authorization: token }
    });

    if (response.data.success && response.data.company.managerId === req.user.userId) {
      req.company = response.data.company;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not a company manager.'
      });
    }
  } catch (error) {
    console.error('Company manager verification error:', error.message);
    res.status(403).json({
      success: false,
      message: 'Company verification failed.'
    });
  }
};

// Validate booking ownership or company management
const validateBookingAccess = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const Booking = require('../models/Booking');
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    // Check if user owns the booking or manages the company
    const isOwner = booking.userId.toString() === req.user.userId;
    const isManager = booking.companyDetails?.managerEmail === req.user.email;

    if (isOwner || isManager) {
      req.booking = booking;
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Not authorized to access this booking.'
      });
    }
  } catch (error) {
    console.error('Booking access validation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Access validation failed.'
    });
  }
};

module.exports = {
  verifyToken,
  verifyUser,
  isCompanyManager,
  validateBookingAccess
};
