const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const { markAsRead, createBookingNotification } = require('./services/notificationService');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/courtbooking', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testDeleteNotification() {
  try {
    console.log('🧪 Testing notification deletion...');
    
    // Create a test notification
    console.log('📝 Creating test notification...');
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
    
    console.log('✅ Test notification created with ID:', testNotification._id);
    
    // Verify it exists in database
    const existsBefore = await Notification.findById(testNotification._id);
    console.log('📄 Notification exists before deletion:', !!existsBefore);
    
    // Test deleting it (mark as read)
    console.log('🗑️ Testing deletion...');
    const result = await markAsRead(testNotification._id, '507f1f77bcf86cd799439011');
    
    if (result) {
      console.log('✅ Notification successfully deleted');
      
      // Verify it's gone from database
      const existsAfter = await Notification.findById(testNotification._id);
      console.log('📄 Notification exists after deletion:', !!existsAfter);
      
      if (!existsAfter) {
        console.log('🎉 SUCCESS: Notification was properly deleted from database!');
      } else {
        console.log('❌ FAILED: Notification still exists in database');
      }
    } else {
      console.log('❌ Failed to delete notification');
    }
    
    // Check total count
    const totalCount = await Notification.countDocuments();
    console.log(`📊 Total notifications remaining: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testDeleteNotification();
