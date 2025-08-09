const Chat = require('../models/Chat');
const Team = require('../models/Team');

// Create a new chat when offer is accepted
exports.createMatchChat = async (offerDetails, team1, team2) => {
  try {
    console.log('🔧 DEBUG createMatchChat:');
    console.log('  offerDetails:', JSON.stringify(offerDetails, null, 2));
    console.log('  team1:', team1.name, 'ID:', team1._id);
    console.log('  team2:', team2.name, 'ID:', team2._id);
    
    const chatId = `match_${team1._id}_${team2._id}_${Date.now()}`;
    
    const chat = new Chat({
      chatId,
      matchDetails: {
        team1: {
          id: team1._id,
          name: team1.name,
          captain: team1.captain
        },
        team2: {
          id: team2._id,
          name: team2.name,
          captain: team2.captain
        },
        sport: offerDetails.sport,
        proposedDate: offerDetails.proposedDate,
        proposedTime: offerDetails.proposedTime,
        court: offerDetails.court || 'TBD'
      },
      participants: [
        {
          userId: team1.captain,
          teamId: team1._id,
          teamName: team1.name,
          role: 'captain'
        },
        {
          userId: team2.captain,
          teamId: team2._id,
          teamName: team2.name,
          role: 'captain'
        }
      ],
      messages: [{
        senderName: 'System',
        message: `🏆 Match chat created! ${team1.name} vs ${team2.name} - ${offerDetails.sport} match scheduled for ${offerDetails.proposedDate} at ${offerDetails.proposedTime}. Court: ${offerDetails.court || 'TBD'}`,
        messageType: 'system',
        timestamp: new Date()
      }]
    });

    await chat.save();
    console.log(`💬 Chat created: ${chatId} between ${team1.name} and ${team2.name}`);
    return chat;
  } catch (error) {
    console.error('Error creating match chat:', error);
    throw error;
  }
};

// Get chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log(`💬 Getting chats for user: ${userId}`);
    console.log(`💬 User object:`, req.user);
    
    // Validate userId
    if (!userId) {
      console.error('💬 ERROR: User ID is missing');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if Chat model is loaded
    console.log(`💬 Chat model available:`, !!Chat);
    
    // Test database connection
    console.log(`💬 Testing Chat model...`);
    const testQuery = await Chat.countDocuments({});
    console.log(`💬 Total chats in database: ${testQuery}`);
    
    const chats = await Chat.find({
      'participants.userId': userId
    }).sort({ lastActivity: -1 });
    
    console.log(`💬 Found ${chats.length} chats for user`);
    if (chats.length > 0) {
      console.log(`💬 Chats:`, chats.map(c => ({ chatId: c.chatId, participants: c.participants })));
    }
    
    res.json({ chats });
  } catch (err) {
    console.error('💬 ERROR getting user chats:', err);
    console.error('💬 ERROR name:', err.name);
    console.error('💬 ERROR message:', err.message);
    console.error('💬 ERROR stack:', err.stack);
    res.status(500).json({ error: `Database error: ${err.message}` });
  }
};

// Get specific chat
exports.getChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    
    console.log(`💬 Getting chat: ${chatId} for user: ${userId}`);
    
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': userId
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }
    
    res.json({ chat });
  } catch (err) {
    console.error('Error getting chat:', err);
    res.status(500).json({ error: err.message });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    console.log(`💬 Sending message to chat: ${chatId} from user: ${userId}`);
    
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': userId
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }
    
    // Get user's team info from participants
    const participant = chat.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this chat' });
    }
    
    const newMessage = {
      sender: userId,
      senderName: `${participant.teamName} Captain`,
      senderTeam: participant.teamName,
      message: message.trim(),
      timestamp: new Date()
    };
    
    chat.messages.push(newMessage);
    await chat.save();
    
    console.log(`💬 Message sent successfully`);
    
    res.json({ 
      message: 'Message sent successfully',
      messageData: newMessage
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: err.message });
  }
};

// Mark chat as completed
exports.completeChat = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { chatId } = req.params;
    
    const chat = await Chat.findOne({
      chatId,
      'participants.userId': userId
    });
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }
    
    chat.matchDetails.status = 'completed';
    chat.messages.push({
      senderName: 'System',
      message: '🏁 Match completed! This chat is now closed.',
      messageType: 'system',
      timestamp: new Date()
    });
    
    await chat.save();
    
    res.json({ message: 'Chat marked as completed' });
  } catch (err) {
    console.error('Error completing chat:', err);
    res.status(500).json({ error: err.message });
  }
};
