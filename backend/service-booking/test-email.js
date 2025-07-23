require('dotenv').config();
const { sendManagerNotification } = require('./services/emailService');

// Test email functionality
async function testEmail() {
  try {
    console.log('🧪 Testing manager notification email...');
    
    const testBookingDetails = {
      courtName: 'Test Court 1',
      companyName: 'Test Sports Center',
      teamName: 'Test Team',
      playerName: 'John Doe',
      playerEmail: 'player@test.com',
      date: new Date(),
      startTime: '14:00',
      endTime: '15:30',
      duration: 90,
      totalPrice: 50,
      bookingId: '507f1f77bcf86cd799439011', // Test MongoDB ObjectId
      teamSize: 4
    };

    await sendManagerNotification('test@example.com', testBookingDetails);
    console.log('✅ Test email sent successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test email failed:', error);
    process.exit(1);
  }
}

testEmail();
