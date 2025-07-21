const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/teams/create
// @desc    Create a team
// @access  Private
router.post('/create', auth, async (req, res) => {
    const { name } = req.body;
    try {
        let team = await Team.findOne({ name });
        if (team) {
            return res.status(400).json({ msg: 'Team already exists' });
        }
        const newTeam = new Team({
            name,
            captain: req.user.id,
            members: [req.user.id]
        });
        team = await newTeam.save();
        const user = await User.findById(req.user.id);
        user.team = team.id;
        await user.save();
        res.json(team);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/teams/join
// @desc    Join a team
// @access  Private
router.post('/join', auth, async (req, res) => {
    const { joinCode } = req.body;
    try {
        let team = await Team.findOne({ joinCode });
        if (!team) {
            return res.status(400).json({ msg: 'Invalid join code' });
        }
        const user = await User.findById(req.user.id);
        if (user.team) {
            return res.status(400).json({ msg: 'User already in a team' });
        }
        team.members.push(req.user.id);
        await team.save();
        user.team = team.id;
        await user.save();
        res.json(team);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/teams/my-team
// @desc    Get my team
// @access  Private
router.get('/my-team', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'team',
            populate: {
                path: 'members captain',
                select: 'fullName profileImage'
            }
        });
        if (!user.team) {
            return res.status(404).json({ msg: 'User not in a team' });
        }
        res.json(user.team);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
