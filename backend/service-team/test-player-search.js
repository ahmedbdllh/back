const axios = require('axios');

// Test the player search endpoints
async function testPlayerSearch() {
  const baseUrl = 'http://localhost:5004/api/teams';
  
  try {
    console.log('🔍 Testing Player Search Endpoints...\n');
    
    // Test 1: Search all players
    console.log('1. Testing general player search...');
    const searchResponse = await axios.get(`${baseUrl}/search/players`, {
      params: {
        limit: 5,
        page: 1
      }
    });
    
    console.log(`✅ Found ${searchResponse.data.players.length} players`);
    console.log(`📊 Total: ${searchResponse.data.pagination.total}`);
    
    // Test 2: Search players by sport
    console.log('\n2. Testing player search by sport...');
    const sportSearchResponse = await axios.get(`${baseUrl}/search/players`, {
      params: {
        sport: 'Football',
        limit: 5
      }
    });
    
    console.log(`✅ Found ${sportSearchResponse.data.players.length} football players`);
    
    // Test 3: Get available players
    console.log('\n3. Testing available players endpoint...');
    const availableResponse = await axios.get(`${baseUrl}/search/available-players`, {
      params: {
        limit: 5
      }
    });
    
    console.log(`✅ Found ${availableResponse.data.players.length} available players`);
    
    // Test 4: Search with query
    console.log('\n4. Testing search with query...');
    const querySearchResponse = await axios.get(`${baseUrl}/search/players`, {
      params: {
        q: 'john',
        limit: 5
      }
    });
    
    console.log(`✅ Found ${querySearchResponse.data.players.length} players matching "john"`);
    
    console.log('\n🎉 All player search endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing player search:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPlayerSearch();
