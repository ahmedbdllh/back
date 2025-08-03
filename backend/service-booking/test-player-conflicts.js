// Test script to verify player conflict checking
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/courtbooking', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testPlayerConflicts() {
  try {
    console.log('🧪 Testing player conflict checking...');
    
    const testUserId = '507f1f77bcf86cd799439011';
    const testDate = new Date('2025-01-25');
    
    // Check if there are any existing bookings for this test user
    const existingBookings = await Booking.find({
      userId: testUserId,
      date: {
        $gte: new Date(testDate.setHours(0, 0, 0, 0)),
        $lte: new Date(testDate.setHours(23, 59, 59, 999))
      },
      status: 'confirmed'
    });
    
    console.log(`📋 Found ${existingBookings.length} existing bookings for user ${testUserId} on ${testDate.toDateString()}`);
    
    if (existingBookings.length > 0) {
      console.log('📄 Existing bookings:');
      existingBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.startTime} - ${booking.endTime} (Court: ${booking.courtDetails?.name || booking.courtId})`);
      });
      
      // Test conflict detection logic
      const testStartTime = '14:00';
      const testEndTime = '15:30';
      
      console.log(`\n🔍 Testing conflict with new booking: ${testStartTime} - ${testEndTime}`);
      
      const [requestedStartHour, requestedStartMin] = testStartTime.split(':').map(Number);
      const [requestedEndHour, requestedEndMin] = testEndTime.split(':').map(Number);
      const requestedStartMinutes = requestedStartHour * 60 + requestedStartMin;
      const requestedEndMinutes = requestedEndHour * 60 + requestedEndMin;

      const conflict = existingBookings.find(booking => {
        const [bookingStartHour, bookingStartMin] = booking.startTime.split(':').map(Number);
        const [bookingEndHour, bookingEndMin] = booking.endTime.split(':').map(Number);
        const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
        const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;

        const hasOverlap = requestedStartMinutes < bookingEndMinutes && requestedEndMinutes > bookingStartMinutes;
        return hasOverlap;
      });
      
      if (conflict) {
        console.log('❌ CONFLICT DETECTED - Player cannot book multiple courts at same time');
        console.log(`   Conflicting with: ${conflict.startTime} - ${conflict.endTime}`);
      } else {
        console.log('✅ NO CONFLICT - Player can book this time slot');
      }
      
    } else {
      console.log('✅ No existing bookings - player can book any available time slot');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testPlayerConflicts();
