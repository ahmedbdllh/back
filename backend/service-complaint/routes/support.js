const express = require('express');
const router = express.Router();
const SupportViewModel = require('../viewmodels/SupportViewModel');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all support categories
router.get('/categories', async (req, res) => {
  try {
    const result = await SupportViewModel.getSupportCategories();
    res.json(result);
  } catch (error) {
    console.error('Error fetching support categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support categories',
      error: error.message
    });
  }
});

// Get FAQ items
router.get('/faq', async (req, res) => {
  try {
    const { category } = req.query;
    const result = await SupportViewModel.getFAQItems(category);
    res.json(result);
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ items',
      error: error.message
    });
  }
});

// Get contact information
router.get('/contact', async (req, res) => {
  try {
    const result = await SupportViewModel.getContactInfo();
    res.json(result);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
      error: error.message
    });
  }
});

// Submit a quick help request
router.post('/quick-help', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, subject, message'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const result = await SupportViewModel.submitQuickHelp({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim()
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting quick help:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit help request',
      error: error.message
    });
  }
});

// Get support guidelines
router.get('/guidelines', async (req, res) => {
  try {
    const result = await SupportViewModel.getSupportGuidelines();
    res.json(result);
  } catch (error) {
    console.error('Error fetching support guidelines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support guidelines',
      error: error.message
    });
  }
});

// Get help requests (admin/manager only)
router.get('/help-requests', verifyToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.start = new Date(startDate);
      if (endDate) filters.dateRange.end = new Date(endDate);
    }

    const result = await SupportViewModel.getHelpRequests(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch help requests',
      error: error.message
    });
  }
});

// Health check for support service
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'support-api',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
