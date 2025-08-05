const express = require('express');
const router = express.Router();
const { verifyToken, verifyUser } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../services/notificationService');

// @route   GET /api/notifications
// @desc    Get notifications for authenticated user
// @access  Private
router.get('/', verifyToken, verifyUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.userId;
    
    const result = await getNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit), 
      unreadOnly === 'true'
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', verifyToken, verifyUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await getUnreadCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', verifyToken, verifyUser, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;
    
    const notification = await markAsRead(notificationId, userId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', verifyToken, verifyUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await markAllAsRead(userId);
    
    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

module.exports = router;
