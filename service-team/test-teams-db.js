const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sportify-teams', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Team schema (simplified)
const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  description: String,
  logo: String,
  captain: { type: mongoose.Schema.Types.ObjectId, required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'active' }
  }],
  settings: {
    isPublic: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 20 },
    joinRequests: { type: Boolean, default: true }
  },
  location: {
    city: String,
    country: String,
    address: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Team = mongoose.model('Team', TeamSchema);

async function checkAndCreateTeams() {
  try {
    console.log('Connecting to database...');
    
    // Check existing teams
    const existingTeams = await Team.find({});
    console.log(`Found ${existingTeams.length} existing teams:`);
    existingTeams.forEach(team => {
      console.log(`- ${team.name} (${team.sport}) - Public: ${team.settings?.isPublic} - Members: ${team.members?.length || 0}`);
    });

    // Add members to existing teams if they have no members
    if (existingTeams.length > 0) {
      for (const team of existingTeams) {
        if (!team.members || team.members.length === 0) {
          console.log(`\nAdding sample members to ${team.name}...`);
          
          // Create some sample member IDs
          const sampleMembers = [];
          for (let i = 0; i < 6; i++) {
            sampleMembers.push({
              userId: new mongoose.Types.ObjectId(),
              position: i === 0 ? 'GK' : (i < 3 ? 'DEF' : 'MID'),
              jerseyNumber: i + 1,
              joinedAt: new Date(),
              status: 'active',
              isStarter: i < 4
            });
          }
          
          team.members = sampleMembers;
          await team.save();
          console.log(`✅ Added ${sampleMembers.length} members to ${team.name}`);
        }
      }
    }

    if (existingTeams.length === 0) {
      console.log('\nNo teams found. Creating sample teams...');
      
      // Create some sample teams
      const sampleTeams = [
        {
          name: 'Thunder Eagles FC',
          sport: 'Football',
          description: 'Competitive football team looking for skilled players',
          captain: new mongoose.Types.ObjectId(),
          members: [
            { userId: new mongoose.Types.ObjectId(), position: 'GK', jerseyNumber: 1, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'DEF', jerseyNumber: 2, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'DEF', jerseyNumber: 3, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'MID', jerseyNumber: 4, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'MID', jerseyNumber: 5, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'ATT', jerseyNumber: 6, status: 'active' }
          ],
          settings: { isPublic: true, maxMembers: 20, joinRequests: true },
          location: { city: 'New York', country: 'USA' },
          logo: null
        },
        {
          name: 'Lightning Wolves',
          sport: 'Basketball',
          description: 'Fast-paced basketball team for competitive players',
          captain: new mongoose.Types.ObjectId(),
          members: [
            { userId: new mongoose.Types.ObjectId(), position: 'PG', jerseyNumber: 1, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'SG', jerseyNumber: 2, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'SF', jerseyNumber: 3, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'PF', jerseyNumber: 4, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'C', jerseyNumber: 5, status: 'active' }
          ],
          settings: { isPublic: false, maxMembers: 15, joinRequests: true },
          location: { city: 'Los Angeles', country: 'USA' },
          logo: null
        },
        {
          name: 'Ace Tennis Club',
          sport: 'Tennis',
          description: 'Recreational tennis group for all skill levels',
          captain: new mongoose.Types.ObjectId(),
          members: [
            { userId: new mongoose.Types.ObjectId(), position: 'Singles', jerseyNumber: 1, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'Doubles', jerseyNumber: 2, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'Doubles', jerseyNumber: 3, status: 'active' },
            { userId: new mongoose.Types.ObjectId(), position: 'Singles', jerseyNumber: 4, status: 'active' }
          ],
          settings: { isPublic: true, maxMembers: 12, joinRequests: true },
          location: { city: 'Miami', country: 'USA' },
          logo: null
        }
      ];

      for (const teamData of sampleTeams) {
        const team = new Team(teamData);
        await team.save();
        console.log(`✅ Created team: ${team.name} with ${team.members.length} members`);
      }
      
      console.log('\nSample teams created successfully!');
    }

    // Check final count
    const finalTeams = await Team.find({});
    console.log(`\nTotal teams in database: ${finalTeams.length}`);
    finalTeams.forEach(team => {
      console.log(`- ${team.name}: ${team.members?.length || 0} members`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAndCreateTeams();
