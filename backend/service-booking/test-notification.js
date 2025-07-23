const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const { createBookingNotification } = require('./services/notificationService');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/courtbooking', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing notification system...');
    
    // Clear existing test notifications
    await Notification.deleteMany({ title: '🔔 New Booking Received' });
    console.log('🧹 Cleared existing test notifications');
    
    // Create a test notification with mock data
    console.log('🔔 Creating test notification with mock data...');
    const testNotification = await createBookingNotification(
      '507f1f77bcf86cd799439011', // managerId (dummy)
      {
        userId: '507f1f77bcf86cd799439012',
        name: 'John Doe'
      },
      {
        booking: {
          _id: '507f1f77bcf86cd799439013',
          date: new Date('2025-01-25'),
          startTime: '14:00',
          endTime: '15:00',
          totalPrice: 50,
          teamDetails: null
        },
        court: {
          _id: '507f1f77bcf86cd799439014',
          name: 'Tennis Court A'
        },
        company: {
          companyName: 'Sports Center'
        }
      }
    );
    
    console.log('✅ Test notification created:', {
      id: testNotification._id,
      recipientId: testNotification.recipientId,
      title: testNotification.title,
      message: testNotification.message,
      bookingDetails: testNotification.bookingDetails
    });
    
    // Check if the courtName and timeSlot are properly set
    console.log('📄 Checking notification details:');
    console.log(`  Court Name: ${testNotification.bookingDetails.courtName}`);
    console.log(`  Date: ${new Date(testNotification.bookingDetails.date).toLocaleDateString()}`);
    console.log(`  Time Slot: ${testNotification.bookingDetails.timeSlot}`);
    console.log(`  Player Name: ${testNotification.bookingDetails.playerName}`);
    
    // Verify the notification was saved correctly
    const savedNotification = await Notification.findById(testNotification._id);
    console.log('� Notification verification:');
    console.log(`  Saved correctly: ${!!savedNotification}`);
    console.log(`  Court name in DB: ${savedNotification?.bookingDetails?.courtName || 'MISSING'}`);
    console.log(`  Time slot in DB: ${savedNotification?.bookingDetails?.timeSlot || 'MISSING'}`);
    
    // Check total notifications count
    const totalNotifications = await Notification.countDocuments();
    console.log(`📊 Total notifications in database: ${totalNotifications}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testNotificationSystem();
