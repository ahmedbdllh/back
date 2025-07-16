const Team = require('../models/Team');
const TeamInvitation = require('../models/TeamInvitation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/teams';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'team-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Helper function to fetch user data from auth service
const fetchUserData = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    
    const response = await axios.post('http://localhost:5000/api/auth/users/bulk', {
      userIds: userIds
    });
    
    return response.data.users || [];
  } catch (error) {
    console.error('❌ Error fetching user data:', error.message);
    if (error.response) {
      console.error('❌ Auth service error details:', error.response.data);
    }
    return [];
  }
};

// Helper function to generate a random secret code
const generateSecretCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper function to update team match-ready status
const updateTeamMatchReadyStatus = async (team) => {
  const activeMembers = team.members.filter(member => member.status === 'active').length;
  const requiredPlayers = team.fieldType || 6; // Default to 6 if no fieldType
  team.isMatchReady = activeMembers >= requiredPlayers;
  return team;
};

// Helper function to clean up invalid invitations (captain inviting themselves)
const cleanupInvalidInvitations = async () => {
  try {
    const result = await TeamInvitation.deleteMany({
      $expr: { $eq: ['$captain', '$invitedPlayer'] }
    });
    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} invalid invitations where captain invited themselves`);
    }
  } catch (error) {
    console.error('Error cleaning up invalid invitations:', error);
  }
};

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const { sport, city, search, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (sport) filter.sport = sport;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    // Only show public teams unless user is authenticated
    if (!req.user) {
      filter['settings.isPublic'] = true;
    }

    const teams = await Team.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get all unique user IDs for captain and members
    const userIds = new Set();
    teams.forEach(team => {
      userIds.add(team.captain.toString());
      team.members.forEach(member => userIds.add(member.userId.toString()));
    });

    // Fetch user data
    const users = await fetchUserData([...userIds]);
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Enrich teams with user data
    const enrichedTeams = teams.map(team => {
      const teamObj = team.toObject();
      
      // Add captain info (ensure phoneNumber is included)
      const captainUser = userMap[team.captain.toString()];
      teamObj.captainInfo = captainUser
        ? {
            _id: captainUser._id,
            fullName: captainUser.fullName || captainUser.name || 'Unknown Captain',
            email: captainUser.email || 'unknown@example.com',
            phoneNumber: captainUser.phoneNumber || 'N/A',
            // add any other fields you want to expose
          }
        : {
            _id: team.captain,
            fullName: 'Unknown Captain',
            email: 'unknown@example.com',
            phoneNumber: 'N/A',
          };

      // Add member info with user details
      teamObj.members = team.members.map(member => ({
        ...member.toObject(),
        userInfo: userMap[member.userId.toString()] || {
          _id: member.userId,
          fullName: 'Unknown User',
          email: 'unknown@example.com'
        }
      }));

      // Add players field for frontend compatibility (maps to members)
      teamObj.players = team.members.map(member => {
        const userInfo = userMap[member.userId.toString()] || {
          _id: member.userId,
          fullName: 'Unknown User',
          email: 'unknown@example.com'
        };
        return {
          ...member.toObject(),
          ...userInfo,
          profileImage: userInfo.profileImage
        };
      });

      return teamObj;
    });

    const total = await Team.countDocuments(filter);

    res.json({
      teams: enrichedTeams,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if team is private and user is not a member
    if (!team.settings.isPublic && req.user) {
      const isMember = team.members.some(member => 
        member.userId.toString() === req.user.id && member.status === 'active'
      );
      const isCaptain = team.captain.toString() === req.user.id;
      
      if (!isMember && !isCaptain) {
        return res.status(403).json({ error: 'This team is private' });
      }
    }

    // Get all user IDs
    const userIds = [team.captain.toString()];
    team.members.forEach(member => userIds.push(member.userId.toString()));
    team.joinRequests.forEach(request => userIds.push(request.userId.toString()));

    // Fetch user data
    const users = await fetchUserData([...new Set(userIds)]);
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    // Enrich team with user data
    const teamObj = team.toObject();
    
    teamObj.captainInfo = userMap[team.captain.toString()] || {
      _id: team.captain,
      fullName: 'Unknown Captain',
      email: 'unknown@example.com'
    };

    teamObj.members = team.members.map(member => ({
      ...member.toObject(),
      userInfo: userMap[member.userId.toString()] || {
        _id: member.userId,
        fullName: 'Unknown User',
        email: 'unknown@example.com'
      }
    }));

    teamObj.joinRequests = team.joinRequests.map(request => ({
      ...request.toObject(),
      userInfo: userMap[request.userId.toString()] || {
        _id: request.userId,
        fullName: 'Unknown User',
        email: 'unknown@example.com'
      }
    }));

    // Add captain status for the requesting user
    if (req.user) {
      const captainId = team.captain.toString();
      // More robust user ID extraction
      let userId = '';
      if (req.user.id) {
        userId = req.user.id.toString();
      } else if (req.user._id) {
        userId = req.user._id.toString();
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
      
      console.log('🔍 Captain comparison debug:');
      console.log('  - Full req.user object:', JSON.stringify(req.user, null, 2));
      console.log('  - team.captain (raw):', team.captain);
      console.log('  - team.captain type:', typeof team.captain);
      console.log('  - team.captain.toString():', captainId);
      console.log('  - req.user.id:', req.user.id);
      console.log('  - req.user._id:', req.user._id);
      console.log('  - userId (processed):', userId);
      console.log('  - userId type:', typeof userId);
      console.log('  - Comparison result (===):', captainId === userId);
      console.log('  - Comparison result (==):', captainId == userId);
      
      // Fix: Ensure both IDs are strings and properly compare
      const normalizedCaptainId = captainId;
      const normalizedUserId = userId;
      const isCaptain = normalizedCaptainId === normalizedUserId;
      
      console.log('  - Final comparison:');
      console.log('    - normalizedCaptainId:', normalizedCaptainId);
      console.log('    - normalizedUserId:', normalizedUserId);
      console.log('    - isCaptain result:', isCaptain);
      
      teamObj.isCaptain = isCaptain;
      teamObj.isMember = team.members.some(member => 
        member.userId.toString() === userId && member.status === 'active'
      );
    } else {
      teamObj.isCaptain = false;
      teamObj.isMember = false;
    }

    res.json(teamObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new team
exports.createTeam =  [
    upload.single('logo'),
    async (req, res) => {
      try {
        const { name, sport, description, maxMembers, fieldType, location, settings, selectedPlayers, formation, isPublic } = req.body;
        
        if (!req.user?.id) {
          console.error('❌ No user ID found in request');
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Parse JSON fields if they exist
        const parsedLocation = location ? JSON.parse(location) : {};
        const parsedSettings = settings ? JSON.parse(settings) : {};
        const parsedSelectedPlayers = selectedPlayers ? JSON.parse(selectedPlayers) : [];
        
        // Parse isPublic from request
        const teamIsPublic = isPublic === 'true' || isPublic === true;

        // Check if captain already has a team of this sport type
        const existingTeam = await Team.findOne({
          captain: req.user.id,
          sport: sport
        });

        if (existingTeam) {
          return res.status(400).json({ 
            error: `You already have a ${sport} team named "${existingTeam.name}". You can only create one team per sport type.`,
            existingTeam: {
              _id: existingTeam._id,
              name: existingTeam.name,
              sport: existingTeam.sport
            }
          });
        }

        const teamData = {
          name,
          sport,
          description,
          captain: req.user.id,
          maxMembers: 8, // Always 8 total players
          fieldType: parseInt(fieldType) || 6, // 6 or 7 players on field
          formation: formation || null, // Add formation if provided
          location: parsedLocation,
          settings: {
            isPublic: teamIsPublic,
            allowJoinRequests: parsedSettings.allowJoinRequests !== undefined ? parsedSettings.allowJoinRequests : true,
            requireApproval: parsedSettings.requireApproval !== undefined ? parsedSettings.requireApproval : true,
            secretCode: teamIsPublic ? null : generateSecretCode() // Generate secret code for private teams
          }
        };

        if (req.file) {
          teamData.logo = '/' + req.file.path.replace(/\\/g, '/');
        } else {
          // Set default team logo path
          teamData.logo = '/uploads/default/team-default.jpg';
        }

        // Add captain as first member
        teamData.members = [{
          userId: req.user.id,
          position: 'Captain',
          joinedAt: new Date(),
          status: 'active'
        }];

        // Create team first without other players
        const team = new Team(teamData);
        
        // Update match-ready status based on member count and field type
        updateTeamMatchReadyStatus(team);
        
        await team.save();

        // Send invitations to selected players if any
        let invitationsSent = 0;
        if (parsedSelectedPlayers && parsedSelectedPlayers.length > 0) {
          for (const player of parsedSelectedPlayers) {
            // Skip sending invitation to the captain (themselves)
            const playerId = player._id || player.id;
            if (playerId === req.user.id) {
              continue;
            }
            
            try {
              const invitation = new TeamInvitation({
                team: team._id,
                captain: req.user.id,
                invitedPlayer: playerId,
                position: player.position || null,
                message: `You have been invited to join the team "${team.name}" as a ${player.position || 'player'}.`
              });
              
              await invitation.save();
              invitationsSent++;
            } catch (inviteErr) {
              console.error(`❌ Failed to send invitation to player ${playerId}:`, inviteErr.message);
            }
          }
        }

        res.status(201).json({
          message: 'Team created successfully',
          team: team,
          invitationsSent: invitationsSent,
          totalPlayersInvited: parsedSelectedPlayers.length
        });
      } catch (err) {
        console.error('❌ Error creating team:', err.message);
        console.error('❌ Full error:', err);
        res.status(400).json({ error: err.message });
      }
    }
  ];

// Update team
exports.updateTeam = [
  upload.single('logo'),
  async (req, res) => {
    try {
      const team = await Team.findById(req.params.id);
      
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Check if user is captain
      if (team.captain.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Only team captain can update team details' });
      }

      const { name, sport, description, maxMembers, location, settings } = req.body;
      
      // Parse JSON fields if they exist
      const parsedLocation = location ? JSON.parse(location) : team.location;
      const parsedSettings = settings ? JSON.parse(settings) : team.settings;

      // Update fields
      if (name) team.name = name;
      if (sport) team.sport = sport;
      if (description !== undefined) team.description = description;
      if (maxMembers) team.maxMembers = maxMembers;
      team.location = parsedLocation;
      team.settings = parsedSettings;

      if (req.file) {
        // Delete old logo if exists
        if (team.logo && fs.existsSync(team.logo.substring(1))) {
          fs.unlinkSync(team.logo.substring(1));
        }
        team.logo = '/' + req.file.path.replace(/\\/g, '/');
      }

      await team.save();

      res.json({
        message: 'Team updated successfully',
        team: team
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
];

// Delete team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is captain
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can delete the team' });
    }

    // Delete logo file if exists
    if (team.logo && fs.existsSync(team.logo.substring(1))) {
      fs.unlinkSync(team.logo.substring(1));
    }

    await Team.findByIdAndDelete(req.params.id);

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Join team request
exports.requestToJoin = async (req, res) => {
  try {
    const { message } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if team allows join requests
    if (!team.settings.allowJoinRequests) {
      return res.status(403).json({ error: 'This team is not accepting new members' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.userId.toString() === req.user.id
    );
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }

    // Check if user already has a pending request
    const existingRequest = team.joinRequests.find(request => 
      request.userId.toString() === req.user.id && request.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this team' });
    }

    // Check if team is full
    const activeMembers = team.members.filter(member => member.status === 'active').length;
    if (activeMembers >= team.maxMembers) {
      return res.status(400).json({ error: 'Team is full' });
    }

    // Add join request
    team.joinRequests.push({
      userId: req.user.id,
      message: message || '',
      requestedAt: new Date(),
      status: 'pending'
    });

    await team.save();

    res.json({ message: 'Join request sent successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle join request (approve/reject)
exports.handleJoinRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'approve' or 'reject'
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is captain
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can handle join requests' });
    }

    const request = team.joinRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed' });
    }

    if (action === 'approve') {
      // Check if team is full
      const activeMembers = team.members.filter(member => member.status === 'active').length;
      if (activeMembers >= team.maxMembers) {
        return res.status(400).json({ error: 'Team is full' });
      }

      // Add user to team members
      team.members.push({
        userId: request.userId,
        joinedAt: new Date(),
        status: 'active'
      });
      
      request.status = 'approved';
    } else if (action === 'reject') {
      request.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    // Update match-ready status after member changes
    if (action === 'approve') {
      updateTeamMatchReadyStatus(team);
    }

    await team.save();

    res.json({ 
      message: `Join request ${action}ed successfully`,
      team: team
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove member from team
exports.removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isCaptain = team.captain.toString() === req.user.id;
    const isSelfRemoval = memberId === req.user.id;

    // Check permissions: captain can remove any member, or user can remove themselves
    if (!isCaptain && !isSelfRemoval) {
      return res.status(403).json({ error: 'You can only remove yourself from the team' });
    }

    // Captain cannot remove themselves (they need to delete the team or transfer captaincy)
    if (isCaptain && isSelfRemoval) {
      return res.status(400).json({ error: 'Captain cannot leave the team. Transfer captaincy or delete the team instead.' });
    }

    // Find and remove member
    const memberIndex = team.members.findIndex(member => 
      member.userId.toString() === memberId
    );
    
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    team.members.splice(memberIndex, 1);
    
    // Update match-ready status after removing member
    updateTeamMatchReadyStatus(team);
    
    await team.save();

    const action = isSelfRemoval ? 'left' : 'removed';
    res.json({ message: `Member ${action} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update member details
exports.updateMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { position, jerseyNumber, status } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is captain
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can update member details' });
    }

    const member = team.members.find(member => 
      member.userId.toString() === memberId
    );
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    // Check if jersey number is already taken
    if (jerseyNumber) {
      const existingMember = team.members.find(m => 
        m.jerseyNumber === parseInt(jerseyNumber) && 
        m.userId.toString() !== memberId
      );
      if (existingMember) {
        return res.status(400).json({ error: 'Jersey number already taken' });
      }
      member.jerseyNumber = jerseyNumber;
    }

    if (position) member.position = position;
    if (status) member.status = status;

    // Update match-ready status if member status changed
    if (status) {
      updateTeamMatchReadyStatus(team);
    }

    await team.save();

    res.json({ 
      message: 'Member updated successfully',
      member: member
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get teams where user is a member
exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { captain: req.user.id },
        { 'members.userId': req.user.id, 'members.status': 'active' }
      ]
    });

    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search for players
exports.searchPlayers = async (req, res) => {
  try {
    const { q, sport, position, excludeTeamId, limit = 20, page = 1 } = req.query;
    
    // Build search criteria for auth service
    const searchParams = new URLSearchParams();
    
    if (q) {
      searchParams.append('q', q);
    }
    if (sport) {
      searchParams.append('sport', sport);
    }
    if (position) {
      searchParams.append('position', position);
    }
    if (excludeTeamId) {
      searchParams.append('excludeTeamId', excludeTeamId);
    }
    
    searchParams.append('limit', limit);
    searchParams.append('page', page);
    searchParams.append('role', 'Player'); // Only search for players

    // Call auth service to search for players
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.get(`${authServiceUrl}/api/users/search?${searchParams.toString()}`, {
      headers: {
        'Authorization': req.headers.authorization || `Bearer ${req.headers['x-auth-token']}`
      }
    });

    const players = response.data.users || [];
    const total = response.data.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      players,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error searching players:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: error.response.data.error || 'Error searching players' 
      });
    }
    res.status(500).json({ error: 'Server error while searching players' });
  }
};

// Get available players (not in any team or in specific team)
exports.getAvailablePlayers = async (req, res) => {
  try {
    const { sport, position, excludeTeamId, limit = 20, page = 1 } = req.query;
    
    // Build search criteria
    const searchParams = new URLSearchParams();
    searchParams.append('available', 'true'); // Only get available players
    searchParams.append('role', 'Player');
    
    if (sport) {
      searchParams.append('sport', sport);
    }
    if (position) {
      searchParams.append('position', position);
    }
    if (excludeTeamId) {
      searchParams.append('excludeTeamId', excludeTeamId);
    }
    
    searchParams.append('limit', limit);
    searchParams.append('page', page);

    // Call auth service to get available players
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.get(`${authServiceUrl}/api/users/available-players?${searchParams.toString()}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });

    const players = response.data.users || [];
    const total = response.data.pagination?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      players,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting available players:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: error.response.data.error || 'Error getting available players' 
      });
    }
    res.status(500).json({ error: 'Server error while getting available players' });
  }
};

// Direct invite to team (captain can invite players directly)
exports.invitePlayer = async (req, res) => {
  try {
    const { playerIds, positions } = req.body; // Array of player IDs to invite
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is captain
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can invite players' });
    }

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one player ID' });
    }

    const activeMembers = team.members.filter(member => member.status === 'active').length;
    const availableSlots = team.maxMembers - activeMembers;
    
    if (playerIds.length > availableSlots) {
      return res.status(400).json({ 
        error: `Can only add ${availableSlots} more players. Team limit is ${team.maxMembers}.` 
      });
    }

    // Check if any of the players are already members
    const existingMemberIds = team.members.map(member => member.userId.toString());
    const duplicateIds = playerIds.filter(id => existingMemberIds.includes(id.toString()));
    
    if (duplicateIds.length > 0) {
      return res.status(400).json({ 
        error: 'Some players are already team members',
        duplicateIds 
      });
    }

    // Add players directly as active members
    const newMembers = playerIds.map((playerId, index) => ({
      userId: playerId,
      position: positions && positions[index] ? positions[index] : null,
      joinedAt: new Date(),
      status: 'active'
    }));

    team.members.push(...newMembers);
    
    // Update match-ready status
    updateTeamMatchReadyStatus(team);
    
    await team.save();

    res.json({ 
      message: `Successfully added ${playerIds.length} player(s) to the team`,
      addedPlayers: newMembers.length,
      totalMembers: team.members.filter(m => m.status === 'active').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's teams (teams where user is captain or member)
exports.getUserTeams = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;

    // Find teams where user is either captain or a member
    const teams = await Team.find({
      $or: [
        { captain: userId },
        { 'members.userId': userId }
      ]
    }).sort({ createdAt: -1 });

    // Get all unique user IDs for captain and members
    const userIds = new Set();
    teams.forEach(team => {
      userIds.add(team.captain.toString());
      team.members.forEach(member => userIds.add(member.userId.toString()));
    });

    // Fetch user data
    const users = await fetchUserData([...userIds]);
    console.log('🔍 getUserTeams: Fetched user data for', users.length, 'users');
    console.log('🔍 getUserTeams: User IDs requested:', [...userIds]);
    if (users.length > 0) {
      console.log('🔍 getUserTeams: Sample user data:', {
        id: users[0]._id,
        fullName: users[0].fullName,
        email: users[0].email,
        profileImage: users[0].profileImage
      });
    }
    
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    // Enrich teams with user data and update match-ready status
    const enrichedTeams = await Promise.all(teams.map(async (team) => {
      const teamObj = team.toObject();
      
      // Add captain info
      teamObj.captainInfo = userMap[team.captain.toString()] || {
        _id: team.captain,
        fullName: 'Unknown Captain',
        email: 'unknown@example.com'
      };

      // Add member info with user details
      teamObj.members = team.members.map(member => {
        const userData = userMap[member.userId.toString()];
        const enrichedMember = {
          ...member.toObject(),
          userInfo: userData || {
            _id: member.userId,
            fullName: 'Unknown User',
            email: 'unknown@example.com'
          }
        };
        
        console.log('🔍 getUserTeams: Enriching member:', {
          memberId: member.userId.toString(),
          userData: userData ? {
            id: userData._id,
            fullName: userData.fullName,
            email: userData.email,
            profileImage: userData.profileImage
          } : 'NOT FOUND'
        });
        
        return enrichedMember;
      });

      // Add captain status for the requesting user (same logic as getTeamById)
      const captainId = team.captain.toString();
      let userId = '';
      if (req.user.id) {
        userId = req.user.id.toString();
      } else if (req.user._id) {
        userId = req.user._id.toString();
      } else if (typeof req.user === 'string') {
        userId = req.user;
      }
      
      const isCaptain = captainId === userId;
      teamObj.isCaptain = isCaptain;
      teamObj.isMember = team.members.some(member => 
        member.userId.toString() === userId && member.status === 'active'
      );

      // Update match-ready status
      await updateTeamMatchReadyStatus(team);
      teamObj.isMatchReady = team.isMatchReady;

      return teamObj;
    }));

    res.json({
      teams: enrichedTeams,
      total: enrichedTeams.length
    });
  } catch (err) {
    console.error('Error getting user teams:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update team formation and player positions
exports.updateTeamFormation = async (req, res) => {
  try {
    const { formation, memberPositions } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user is captain - only captains can update formation
    const isCaptain = team.captain.toString() === req.user.id;

    if (!isCaptain) {
      return res.status(403).json({ error: 'Only team captain can update formation and player positions' });
    }

    // Update team formation
    if (formation) {
      team.formation = formation;
    }

    // Update member positions
    if (memberPositions && Array.isArray(memberPositions)) {
      memberPositions.forEach(memberPos => {
        const memberIndex = team.members.findIndex(
          member => member.userId.toString() === memberPos.userId
        );
        
        if (memberIndex !== -1) {
          team.members[memberIndex].position = memberPos.position;
          team.members[memberIndex].x = memberPos.x;
          team.members[memberIndex].y = memberPos.y;
          team.members[memberIndex].isStarter = memberPos.isStarter;
        }
      });
    }

    // Save the updated team
    await team.save();

    // Update match-ready status
    await updateTeamMatchReadyStatus(team);

    res.json({
      message: 'Team formation updated successfully',
      team: {
        ...team.toObject(),
        isMatchReady: team.isMatchReady
      }
    });
  } catch (err) {
    console.error('Error updating team formation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Team Invitation Management Functions

// Get user's received invitations
exports.getUserInvitations = async (req, res) => {
  try {
    // Clean up any invalid invitations first
    await cleanupInvalidInvitations();
    
    const invitations = await TeamInvitation.find({
      invitedPlayer: req.user.id,
      status: 'pending',
      // Explicitly exclude invitations where captain equals invited player
      captain: { $ne: req.user.id }
    })
    .populate('team', 'name sport logo fieldType')
    .sort({ invitedAt: -1 });

    // Fetch captain details from auth service for each invitation
    const enrichedInvitations = await Promise.all(invitations.map(async (invitation) => {
      try {
        const captainData = await fetchUserData([invitation.captain]);
        
        const captain = captainData[0] || {
          firstName: 'Unknown',
          lastName: 'Captain',
          email: 'unknown@example.com'
        };
        
        return {
          ...invitation.toObject(),
          captain: captain
        };
      } catch (err) {
        console.error('❌ Error fetching captain data:', err);
        return {
          ...invitation.toObject(),
          captain: {
            firstName: 'Unknown',
            lastName: 'Captain',
            email: 'unknown@example.com'
          }
        };
      }
    }));

    res.json({
      message: 'Invitations retrieved successfully',
      invitations: enrichedInvitations
    });
  } catch (err) {
    console.error('❌ Error fetching user invitations:', err);
    res.status(500).json({ error: err.message });
  }
};

// Accept team invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await TeamInvitation.findById(invitationId)
      .populate('team');
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    if (invitation.invitedPlayer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to accept this invitation' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer pending' });
    }
    
    // Check if team still has space
    const team = await Team.findById(invitation.team._id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    const activeMembers = team.members.filter(m => m.status === 'active').length;
    if (activeMembers >= team.maxMembers) {
      return res.status(400).json({ error: 'Team is already full' });
    }
    
    // Add player to team
    team.members.push({
      userId: req.user.id,
      position: invitation.position || null,
      joinedAt: new Date(),
      status: 'active'
    });
    
    // Update team match-ready status
    updateTeamMatchReadyStatus(team);
    await team.save();
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.respondedAt = new Date();
    await invitation.save();
    
    res.json({
      message: 'Invitation accepted successfully',
      team: team,
      invitation: invitation
    });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Decline team invitation
exports.declineInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await TeamInvitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    if (invitation.invitedPlayer.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to decline this invitation' });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer pending' });
    }
    
    // Update invitation status
    invitation.status = 'declined';
    invitation.respondedAt = new Date();
    await invitation.save();
    
    res.json({
      message: 'Invitation declined successfully',
      invitation: invitation
    });
  } catch (err) {
    console.error('Error declining invitation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get team invitations sent by captain
exports.getTeamInvitations = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    // Verify user is captain of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can view invitations' });
    }
    
    const invitations = await TeamInvitation.find({
      team: teamId
    })
    .populate('invitedPlayer', 'username email firstName lastName')
    .sort({ invitedAt: -1 });
    
    res.json({
      message: 'Team invitations retrieved successfully',
      invitations
    });
  } catch (err) {
    console.error('Error fetching team invitations:', err);
    res.status(500).json({ error: err.message });
  }
};

// Send individual invitation (for adding players after team creation)
exports.sendInvitation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { playerId, position, message } = req.body;
    
    // Verify user is captain of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.captain.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only team captain can send invitations' });
    }
    
    // Prevent captain from inviting themselves
    if (playerId === req.user.id) {
      return res.status(400).json({ error: 'Captain cannot invite themselves' });
    }
    
    // Check if team has space
    const activeMembers = team.members.filter(m => m.status === 'active').length;
    if (activeMembers >= team.maxMembers) {
      return res.status(400).json({ error: 'Team is already full' });
    }
    
    // Check if player is already a member
    const isAlreadyMember = team.members.some(m => 
      m.userId.toString() === playerId && m.status === 'active'
    );
    if (isAlreadyMember) {
      return res.status(400).json({ error: 'Player is already a team member' });
    }
    
    // Check if invitation already exists
    const existingInvitation = await TeamInvitation.findOne({
      team: teamId,
      invitedPlayer: playerId,
      status: 'pending'
    });
    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this player' });
    }
    
    // Create invitation
    const invitation = new TeamInvitation({
      team: teamId,
      captain: req.user.id,
      invitedPlayer: playerId,
      position: position || null,
      message: message || `You have been invited to join the team "${team.name}".`
    });
    
    await invitation.save();
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: invitation
    });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Join team by secret code
exports.joinBySecretCode = async (req, res) => {
  try {
    const { secretCode } = req.body;
    
    if (!secretCode) {
      return res.status(400).json({ error: 'Secret code is required' });
    }
    
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find team by secret code
    const team = await Team.findOne({ 
      'settings.secretCode': secretCode.toUpperCase(),
      'settings.isPublic': false // Only private teams have secret codes
    });
    
    // Only try to populate if team is found
    if (team) {
      try {
        await team.populate('captain', 'fullName name email');
      } catch (populateError) {
        console.error('Error populating captain:', populateError);
        // Continue without population
      }
    }
    
    if (!team) {
      return res.status(404).json({ error: 'Invalid secret code or team not found' });
    }
    
    // Check if user is already a member
    const existingMember = team.members.find(member => 
      member.userId.toString() === req.user.id
    );
    
    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }
    
    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ error: 'Team is full' });
    }
    
    // Add user to team
    team.members.push({
      userId: req.user.id,
      position: 'Player',
      joinedAt: new Date(),
      status: 'active'
    });
    
    // Update match-ready status
    updateTeamMatchReadyStatus(team);
    
    await team.save();
    
    res.json({
      message: 'Successfully joined the team',
      team: {
        _id: team._id,
        name: team.name,
        sport: team.sport,
        captain: team.captain,
        memberCount: team.members.length,
        maxMembers: team.maxMembers
      }
    });
  } catch (err) {
    console.error('Error joining team by secret code:', err);
    res.status(500).json({ error: err.message });
  }
};

// Debug endpoint to check JWT token contents
exports.debugAuth = async (req, res) => {
  try {
    console.log('🔍 Debug Auth Endpoint Called');
    console.log('  - Headers:', req.headers);
    console.log('  - req.user:', req.user);
    console.log('  - req.user type:', typeof req.user);
    if (req.user) {
      console.log('  - req.user.id:', req.user.id);
      console.log('  - req.user._id:', req.user._id);
      console.log('  - req.user.role:', req.user.role);
      console.log('  - JSON.stringify(req.user):', JSON.stringify(req.user, null, 2));
    }
    
    res.json({
      success: true,
      user: req.user,
      headers: {
        authorization: req.headers.authorization,
        'x-auth-token': req.headers['x-auth-token']
      }
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
};

// Get join requests for team captain (for notifications)
exports.getJoinRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find teams where user is captain
    const teams = await Team.find({
      captain: req.user.id,
      'joinRequests.status': 'pending'
    }).select('_id name sport joinRequests');

    // Get all pending join requests
    const allJoinRequests = [];
    teams.forEach(team => {
      const pendingRequests = team.joinRequests.filter(req => req.status === 'pending');
      pendingRequests.forEach(request => {
        allJoinRequests.push({
          _id: request._id,
          teamId: team._id,
          teamName: team.name,
          teamSport: team.sport,
          userId: request.userId,
          message: request.message,
          requestedAt: request.requestedAt,
          status: request.status
        });
      });
    });

    // Fetch user data for all requesting users
    const userIds = allJoinRequests.map(req => req.userId.toString());
    const users = await fetchUserData(userIds);
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = user;
    });

    // Enrich join requests with user data
    const enrichedRequests = allJoinRequests.map(request => ({
      ...request,
      userInfo: userMap[request.userId.toString()] || {
        _id: request.userId,
        fullName: 'Unknown User',
        email: 'unknown@example.com'
      }
    }));

    res.json({
      message: 'Join requests retrieved successfully',
      joinRequests: enrichedRequests
    });
  } catch (err) {
    console.error('Error fetching join requests:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get user's own pending join requests (teams user has requested to join)
exports.getUserJoinRequests = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find teams where user has pending join requests
    const teams = await Team.find({
      'joinRequests.userId': req.user.id,
      'joinRequests.status': 'pending'
    }).select('_id name sport location logo joinRequests');

    // Extract user's pending requests
    const userJoinRequests = [];
    teams.forEach(team => {
      const userRequest = team.joinRequests.find(request => 
        request.userId.toString() === req.user.id && request.status === 'pending'
      );
      if (userRequest) {
        userJoinRequests.push({
          _id: userRequest._id,
          teamId: team._id,
          teamName: team.name,
          teamSport: team.sport,
          teamLocation: team.location,
          teamLogo: team.logo,
          message: userRequest.message,
          requestedAt: userRequest.requestedAt,
          status: userRequest.status
        });
      }
    });

    res.json({
      message: 'User join requests retrieved successfully',
      joinRequests: userJoinRequests
    });
  } catch (err) {
    console.error('Error fetching user join requests:', err);
    res.status(500).json({ error: err.message });
  }
};

// Cancel a join request
exports.cancelJoinRequest = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Find the user's pending join request
    const requestIndex = team.joinRequests.findIndex(request => 
      request.userId.toString() === userId && request.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: 'No pending join request found for this team' });
    }

    // Remove the join request
    team.joinRequests.splice(requestIndex, 1);
    await team.save();

    res.json({ message: 'Join request cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling join request:', err);
    res.status(500).json({ error: err.message });
  }
};
