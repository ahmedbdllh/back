const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const { markAsRead } = require('./services/notificationService');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/courtbooking', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testMarkAsRead() {
  try {
    console.log('🧪 Testing mark as read functionality...');
    
    // Find a notification that's not read
    const unreadNotification = await Notification.findOne({ isRead: false });
    
    if (!unreadNotification) {
      console.log('❌ No unread notifications found. Creating one first...');
      
      // Create a test notification
      const testNotification = new Notification({
        recipientId: '507f1f77bcf86cd799439011',
        senderId: '507f1f77bcf86cd799439012',
        type: 'new_booking',
        title: '🔔 Test Notification',
        message: 'This is a test notification',
        bookingDetails: {
          courtName: 'Test Court',
          date: new Date(),
          timeSlot: '10:00 - 11:00',
          playerName: 'Test Player'
        }
      });
      
      await testNotification.save();
      console.log('✅ Test notification created:', testNotification._id);
      
      // Now test marking it as read
      console.log('🔄 Testing mark as read...');
      const result = await markAsRead(testNotification._id, '507f1f77bcf86cd799439011');
      
      if (result) {
        console.log('✅ Notification marked as read successfully');
        console.log('📄 Updated notification:', {
          id: result._id,
          isRead: result.isRead,
          readAt: result.readAt
        });
      } else {
        console.log('❌ Failed to mark notification as read');
      }
      
    } else {
      console.log('📄 Found unread notification:', {
        id: unreadNotification._id,
        recipientId: unreadNotification.recipientId,
        isRead: unreadNotification.isRead
      });
      
      // Test marking it as read
      console.log('🔄 Testing mark as read...');
      const result = await markAsRead(unreadNotification._id, unreadNotification.recipientId);
      
      if (result) {
        console.log('✅ Notification marked as read successfully');
        console.log('📄 Updated notification:', {
          id: result._id,
          isRead: result.isRead,
          readAt: result.readAt
        });
      } else {
        console.log('❌ Failed to mark notification as read');
      }
    }
    
    // Check all notifications status
    const allNotifications = await Notification.find().select('_id isRead readAt');
    console.log('\n📊 All notifications status:');
    allNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif._id} - ${notif.isRead ? 'READ' : 'UNREAD'} ${notif.readAt ? `(${notif.readAt})` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testMarkAsRead();
