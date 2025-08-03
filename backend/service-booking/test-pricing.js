const mongoose = require('mongoose');
const CalendarConfig = require('./models/CalendarConfig');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/courtbooking', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testPricing() {
  try {
    console.log('🧪 Testing pricing calculation...');
    
    // Mock court data with your specifications
    const mockCourt = {
      pricePerHour: 15,  // 15 DT per hour as you set
      maxPlayersPerTeam: 6  // 6 players per team as you set
    };
    
    // Mock calendar config
    const mockCalendarConfig = {
      pricing: {
        basePrice: 0,  // Default fallback
        specialDates: []
      }
    };
    
    // Create a temp CalendarConfig instance to test the method
    const tempConfig = new CalendarConfig(mockCalendarConfig);
    
    // Test the calculation
    const testDate = new Date('2025-01-25');
    const startTime = '14:00';
    const endTime = '15:30';
    
    console.log('\n📊 Test scenario:');
    console.log('  - Court pricePerHour:', mockCourt.pricePerHour, 'DT');
    console.log('  - Players per team:', mockCourt.maxPlayersPerTeam);
    console.log('  - Expected calculation: 15 × (6 × 2) = 15 × 12 = 180 DT');
    
    const result = tempConfig.calculatePrice(testDate, startTime, endTime, mockCourt);
    
    console.log('\n✅ Result:', result, 'DT');
    
    if (result === 180) {
      console.log('🎉 Calculation is CORRECT!');
    } else {
      console.log('❌ Calculation is WRONG! Expected 180 DT, got', result, 'DT');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testPricing();
