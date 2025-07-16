const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const teamController = require('../controllers/teamController');

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

// Debug routes
router.get('/debug/auth', auth, teamController.debugAuth);

module.exports = router;
