const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportify-teams');
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

// Clear all chats
const clearChats = async () => {
  try {
    // Import Chat model
    const Chat = require('./models/Chat');
    
    // Count existing chats
    const chatCount = await Chat.countDocuments({});
    console.log(`📊 Found ${chatCount} existing chats`);
    
    if (chatCount > 0) {
      // Delete all chats
      const result = await Chat.deleteMany({});
      console.log(`🗑️ Deleted ${result.deletedCount} chats`);
      console.log('✅ All chats cleared successfully!');
    } else {
      console.log('ℹ️ No chats found to delete');
    }
    
    // Verify deletion
    const remainingChats = await Chat.countDocuments({});
    console.log(`📊 Remaining chats: ${remainingChats}`);
    
  } catch (err) {
    console.error('❌ Error clearing chats:', err);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
const main = async () => {
  console.log('🧹 Starting chat cleanup...');
  await connectDB();
  await clearChats();
};

main();
