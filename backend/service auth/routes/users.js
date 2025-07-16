const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/users/search
// @desc    Enhanced search for users (especially players) with multiple criteria
// @access  Private
router.get('/search', auth, async (req, res) => {
    try {
        const { 
            q,           // General search query (name, email)
            sport,       // Filter by preferred sport
            position,    // Filter by position
            role = 'Player', // Default to Player, can be changed
            excludeTeamId, // Exclude players from specific team
            limit = 20,
            page = 1
        } = req.query;

        // Build search criteria
        let searchCriteria = {};

        // Role filter
        if (role) {
            searchCriteria.role = role;
        }

        // General text search (name or email)
        if (q && q.trim()) {
            searchCriteria.$or = [
                { fullName: { $regex: q.trim(), $options: 'i' } },
                { email: { $regex: q.trim(), $options: 'i' } }
            ];
        }

        // Sport filter (for players)
        if (sport && role === 'Player') {
            searchCriteria.preferredSports = { $in: [sport] };
        }

        // Position filter (for players)
        if (position && role === 'Player') {
            searchCriteria.position = { $regex: position, $options: 'i' };
        }

        // Exclude players from specific team
        if (excludeTeamId) {
            searchCriteria.team = { $ne: excludeTeamId };
        }

        // Ensure verified users only
        searchCriteria.isVerified = true;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute search with pagination
        const users = await User.find(searchCriteria)
            .select('fullName email profileImage preferredSports position role phoneNumber team createdAt')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('team', 'name');

        // Get total count for pagination
        const total = await User.countDocuments(searchCriteria);

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total,
                hasNextPage: skip + users.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: 'Server Error during search' });
    }
});

// @route   GET api/users/available-players
// @desc    Get players that are available to join teams
// @access  Private
router.get('/available-players', auth, async (req, res) => {
    try {
        const { 
            sport,       // Filter by preferred sport
            position,    // Filter by position
            excludeTeamId, // Exclude players from specific team
            limit = 20,
            page = 1
        } = req.query;

        // Build search criteria for available players
        let searchCriteria = {
            role: 'Player',
            isVerified: true,
            $or: [
                { team: { $exists: false } }, // No team assigned
                { team: null }                // Team is null
            ]
        };

        // Sport filter
        if (sport) {
            searchCriteria.preferredSports = { $in: [sport] };
        }

        // Position filter
        if (position) {
            searchCriteria.position = { $regex: position, $options: 'i' };
        }

        // Additional exclusion (if they want to exclude specific team members)
        if (excludeTeamId) {
            searchCriteria.team = { $ne: excludeTeamId };
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Execute search
        const users = await User.find(searchCriteria)
            .select('fullName email profileImage preferredSports position phoneNumber createdAt')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const total = await User.countDocuments(searchCriteria);

        res.json({
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total,
                hasNextPage: skip + users.length < total,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (err) {
        console.error('Available players error:', err.message);
        res.status(500).json({ error: 'Server Error getting available players' });
    }
});

// @route   POST api/users/bulk
// @desc    Get multiple users by IDs (for team management)
// @access  Private
router.post('/bulk', auth, async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({ error: 'userIds array is required' });
        }

        const users = await User.find({ _id: { $in: userIds } })
            .select('fullName email profileImage preferredSports position role phoneNumber team createdAt');

        res.json({ users });
    } catch (err) {
        console.error('Bulk users error:', err.message);
        res.status(500).json({ error: 'Server Error getting users' });
    }
});

// @route   GET api/users/stats
// @desc    Get user statistics for dashboard
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments({ role: 'Player', isVerified: true }),
            User.countDocuments({ role: 'Player', isVerified: true, team: { $exists: false } }),
            User.countDocuments({ role: 'Player', isVerified: true, team: { $ne: null } }),
            User.countDocuments({ role: 'Manager', isVerified: true })
        ]);

        res.json({
            totalPlayers: stats[0],
            availablePlayers: stats[1],
            playersInTeams: stats[2],
            totalManagers: stats[3]
        });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.status(500).json({ error: 'Server Error getting stats' });
    }
});

module.exports = router;
