const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who receives the notification
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  // Who triggered the notification
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  // Type of notification
  type: {
    type: String,
    required: true,
    enum: ['new_booking', 'booking_cancelled', 'booking_updated']
  },
  
  // Notification title
  title: {
    type: String,
    required: true
  },
  
  // Notification message
  message: {
    type: String,
    required: true
  },
  
  // Related booking ID
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Related court info
  courtInfo: {
    courtId: mongoose.Schema.Types.ObjectId,
    courtName: String,
    companyName: String
  },
  
  // Booking details for quick display
  bookingDetails: {
    courtName: String, // Add courtName for frontend display
    date: Date,
    timeSlot: String, // Add timeSlot (combined start-end time)
    startTime: String,
    endTime: String,
    playerName: String,
    teamName: String,
    totalPrice: Number
  },
  
  // Notification status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // When the notification was created
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // When the notification was read
  readAt: {
    type: Date,
    default: null
  }
});

// Index for faster queries
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // Auto-delete after 30 days

module.exports = mongoose.model('Notification', notificationSchema);
