const Notification = require('../models/Notification');

// Create a new booking notification for the manager
const createBookingNotification = async (managerId, senderInfo, bookingData) => {
  try {
    const { booking, court, company } = bookingData;
    
    const notificationData = {
      recipientId: managerId,
      senderId: senderInfo.userId,
      type: 'new_booking',
      title: '🔔 New Booking Received',
      message: `${senderInfo.name} booked ${court.name} for ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime}`,
      bookingId: booking._id,
      courtInfo: {
        courtId: court._id,
        courtName: court.name,
        companyName: company.companyName
      },
      bookingDetails: {
        courtName: court.name, // Add courtName to bookingDetails for frontend
        date: booking.date,
        timeSlot: `${booking.startTime} - ${booking.endTime}`, // Combine start and end time
        startTime: booking.startTime,
        endTime: booking.endTime,
        playerName: senderInfo.name,
        teamName: booking.teamDetails?.teamName || null,
        totalPrice: booking.totalPrice
      }
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log('✅ Booking notification created for manager:', managerId);
    return notification;
  } catch (error) {
    console.error('❌ Error creating booking notification:', error);
    throw error;
  }
};

// Create a booking cancellation notification
const createCancellationNotification = async (managerId, senderInfo, bookingData) => {
  try {
    const { booking, court, company } = bookingData;
    
    const notificationData = {
      recipientId: managerId,
      senderId: senderInfo.userId,
      type: 'booking_cancelled',
      title: '❌ Booking Cancelled',
      message: `${senderInfo.name} cancelled their booking for ${court.name} on ${new Date(booking.date).toLocaleDateString()}`,
      bookingId: booking._id,
      courtInfo: {
        courtId: court._id,
        courtName: court.name,
        companyName: company.companyName
      },
      bookingDetails: {
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        playerName: senderInfo.name,
        teamName: booking.teamDetails?.teamName || null,
        totalPrice: booking.totalPrice
      }
    };
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    console.log('✅ Cancellation notification created for manager:', managerId);
    return notification;
  } catch (error) {
    console.error('❌ Error creating cancellation notification:', error);
    throw error;
  }
};

// Get notifications for a user
const getNotifications = async (userId, page = 1, limit = 20, unreadOnly = false) => {
  try {
    const query = { recipientId: userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Notification.countDocuments(query);
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  try {
    // Delete the notification instead of marking as read
    const notification = await Notification.findOneAndDelete(
      { _id: notificationId, recipientId: userId }
    );
    
    return notification;
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
    
    return result;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });
    
    return count;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    throw error;
  }
};

// Delete old notifications (cleanup)
const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`🧹 Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('❌ Error deleting old notifications:', error);
    throw error;
  }
};

module.exports = {
  createBookingNotification,
  createCancellationNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications
};
