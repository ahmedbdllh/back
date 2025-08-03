const express = require('express');
const router = express.Router();
const ComplaintViewModel = require('../viewmodels/ComplaintViewModel');
const { verifyToken, requireRole, validateObjectId } = require('../middleware/auth');

// Create a new complaint
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await ComplaintViewModel.createComplaint(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message
    });
  }
});

// Get all complaints (role-based filtering)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, priority, userId, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;
    if (priority) filters.priority = priority;
    if (userId) filters.userId = userId;
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.start = new Date(startDate);
      if (endDate) filters.dateRange.end = new Date(endDate);
    }

    const result = await ComplaintViewModel.getComplaints(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    }, req.user);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints',
      error: error.message
    });
  }
});

// Get user's own complaints
router.get('/my-complaints', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;

    const result = await ComplaintViewModel.getUserComplaints(req.user.userId, filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    }, req.user);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your complaints',
      error: error.message
    });
  }
});

// Get complaint by ID
router.get('/:id', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const result = await ComplaintViewModel.getComplaintById(req.params.id, req.user);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint',
      error: error.message
    });
  }
});

// Update complaint status (admin/manager only)
router.patch('/:id/status', verifyToken, requireRole(['Admin', 'Manager']), validateObjectId('id'), async (req, res) => {
  try {
    const { status, resolution } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await ComplaintViewModel.updateComplaintStatus(
      req.params.id, 
      status, 
      req.user,
      resolution
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update complaint status',
      error: error.message
    });
  }
});

// Add comment to complaint
router.post('/:id/comments', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const result = await ComplaintViewModel.addComment(
      req.params.id,
      comment.trim(),
      req.user
    );
    
    if (!result.success) {
      return res.status(403).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Delete complaint (admin only or own complaint if pending)
router.delete('/:id', verifyToken, validateObjectId('id'), async (req, res) => {
  try {
    const result = await ComplaintViewModel.deleteComplaint(req.params.id, req.user);
    
    if (!result.success) {
      return res.status(403).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete complaint',
      error: error.message
    });
  }
});

// Get complaint statistics (role-based)
router.get('/stats/overview', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {};
    if (startDate) dateRange.start = new Date(startDate);
    if (endDate) dateRange.end = new Date(endDate);

    const result = await ComplaintViewModel.getComplaintStatistics(dateRange, req.user);
    res.json(result);
  } catch (error) {
    console.error('Error fetching complaint statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint statistics',
      error: error.message
    });
  }
});

// Get allowed categories for current user
router.get('/categories/allowed', verifyToken, async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    const allowedCategories = ComplaintViewModel.getAllowedCategoriesByRole(userRole);
    
    res.json({
      success: true,
      data: {
        role: userRole,
        categories: allowedCategories
      }
    });
  } catch (error) {
    console.error('Error fetching allowed categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch allowed categories',
      error: error.message
    });
  }
});

// Export the router
module.exports = router;
