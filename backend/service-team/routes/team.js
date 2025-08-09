const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const teamController = require('../controllers/teamController');
const chatController = require('../controllers/chatController');

// Chat routes (must come before /:id routes)
router.get('/chats', auth, chatController.getUserChats);
router.get('/chats/:chatId', auth, chatController.getChat);
router.post('/chats/:chatId/messages', auth, chatController.sendMessage);
router.put('/chats/:chatId/complete', auth, chatController.completeChat);

// Player search routes (must come before /:id routes)
router.get('/search/players', auth, teamController.searchPlayers);
router.get('/search/available-players', auth, teamController.getAvailablePlayers);

// Public routes
router.get('/', optionalAuth, teamController.getTeams);
router.get('/:id', auth, teamController.getTeamById);

// Protected routes (require authentication)
router.post('/', auth, teamController.createTeam);
router.put('/:id', auth, teamController.updateTeam);
router.put('/:id/formation', auth, teamController.updateTeamFormation);
router.delete('/:id', auth, teamController.deleteTeam);

// Team membership routes
router.post('/:id/join', auth, teamController.requestToJoin);
router.post('/join-by-code', auth, teamController.joinBySecretCode);
router.post('/:id/invite', auth, teamController.invitePlayer);
router.post('/:id/handle-request', auth, teamController.handleJoinRequest);
router.delete('/:id/members/:memberId', auth, teamController.removeMember);
router.put('/:id/members/:memberId', auth, teamController.updateMember);

// Team invitation routes
router.get('/invitations/received', auth, teamController.getUserInvitations);
router.get('/join-requests/received', auth, teamController.getJoinRequests);
router.get('/join-requests/sent', auth, teamController.getUserJoinRequests);
router.delete('/:id/join-request', auth, teamController.cancelJoinRequest);
router.put('/invitations/:invitationId/accept', auth, teamController.acceptInvitation);
router.put('/invitations/:invitationId/decline', auth, teamController.declineInvitation);
router.get('/:teamId/invitations', auth, teamController.getTeamInvitations);
router.post('/:teamId/invite-player', auth, teamController.sendInvitation);

// User's teams
router.get('/user/me', auth, teamController.getUserTeams);
router.get('/user/:userId', auth, teamController.getUserTeamsByUserId);

// Team offers and instant search
router.get('/my-team', auth, teamController.getMyTeam);
router.get('/instant-search', teamController.instantSearch);
router.post('/offers/create', auth, teamController.makeOffer);
router.get('/offers/received', auth, teamController.getTeamOffers);
router.put('/offers/:offerId/accept', auth, teamController.acceptOffer);
router.put('/offers/:offerId/decline', auth, teamController.declineOffer);

// Debug routes
router.get('/debug/auth', auth, teamController.debugAuth);

// Debug route to test chat functionality (no auth required for testing)
router.get('/debug/test-chat', async (req, res) => {
  try {
    const Chat = require('../models/Chat');
    console.log('🧪 Testing Chat model...');
    
    // Test basic query
    const chatCount = await Chat.countDocuments({});
    console.log(`🧪 Total chats in database: ${chatCount}`);
    
    // Test find query
    const allChats = await Chat.find({}).limit(5);
    console.log(`🧪 Sample chats:`, allChats.map(c => ({ 
      chatId: c.chatId, 
      participants: c.participants,
      messagesCount: c.messages?.length || 0 
    })));
    
    res.json({ 
      success: true, 
      totalChats: chatCount,
      sampleChats: allChats.length,
      message: 'Chat model is working correctly'
    });
  } catch (err) {
    console.error('🧪 Chat test failed:', err);
    res.status(500).json({ 
      error: err.message, 
      stack: err.stack 
    });
  }
});

// Debug route to create a test offer for testing
router.post('/debug/create-test-offer', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const Team = require('../models/Team');
    
    // Find user's team
    const userTeam = await Team.findOne({
      $or: [
        { captain: userId },
        { 'members.user': userId }
      ]
    });
    
    if (!userTeam) {
      return res.status(404).json({ error: 'No team found for user' });
    }
    
    // Find another team to make an offer to
    const otherTeam = await Team.findOne({
      _id: { $ne: userTeam._id },
      captain: { $ne: userId }
    });
    
    if (!otherTeam) {
      return res.status(404).json({ error: 'No other team found to make offer to' });
    }
    
    // Create a test offer
    const testOffer = {
      fromTeam: {
        id: userTeam._id,
        name: userTeam.name
      },
      toTeam: {
        id: otherTeam._id,
        name: otherTeam.name
      },
      proposedTime: '20:00',
      proposedDate: '2025-08-08', // Tomorrow
      court: 'Test Court',
      sport: 'football',
      message: `Test offer from ${userTeam.name}`,
      createdAt: new Date(),
      status: 'pending'
    };
    
    // Add offer to target team
    if (!otherTeam.offers) {
      otherTeam.offers = [];
    }
    otherTeam.offers.push(testOffer);
    await otherTeam.save();
    
    console.log(`🧪 Test offer created from ${userTeam.name} to ${otherTeam.name}`);
    
    res.json({ 
      message: 'Test offer created successfully',
      offer: testOffer,
      fromTeam: userTeam.name,
      toTeam: otherTeam.name
    });
  } catch (err) {
    console.error('Error creating test offer:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to clear all offers for a team
router.delete('/debug/clear-offers', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const Team = require('../models/Team');
    
    const team = await Team.findOne({
      $or: [
        { captain: userId },
        { 'members.user': userId }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const offerCount = team.offers?.length || 0;
    team.offers = [];
    await team.save();
    
    console.log(`🧹 Cleared ${offerCount} offers for team ${team.name}`);
    
    res.json({ 
      message: `Cleared ${offerCount} offers for team ${team.name}` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug route to reset offer status for testing
router.put('/offers/:offerId/reset', auth, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user.userId;
    
    const Team = require('../models/Team');
    
    const team = await Team.findOne({
      $or: [
        { captain: userId },
        { 'members.user': userId }
      ]
    });
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const offerIndex = team.offers.findIndex(offer => offer._id.toString() === offerId);
    if (offerIndex === -1) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    console.log(`🔄 Resetting offer status from ${team.offers[offerIndex].status} to pending`);
    team.offers[offerIndex].status = 'pending';
    delete team.offers[offerIndex].respondedAt;
    await team.save();
    
    res.json({ message: 'Offer status reset to pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
