const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { protect, adminOrHR } = require('../middleware/authMiddleware');
const { syncUser } = require('../utils/syncService');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Only Admin/HR can create)
router.post('/', protect, adminOrHR, async (req, res) => {
    try {
        const { team_name, description, members, team_leader } = req.body;

        if (!team_name) {
            return res.status(400).json({ message: 'Team name is required' });
        }

        // Format members with roles
        const formattedMembers = (members || []).map(member => ({
            user: typeof member === 'object' ? member.user : member,
            role: typeof member === 'object' ? (member.role || 'Member') : 'Member'
        }));

        const team = await Team.create({
            team_name,
            description,
            created_by: req.user._id,
            team_leader: team_leader || req.user._id, // Default to creator if not specified
            members: formattedMembers,
            status: 'Pending'
        });

        const populatedTeam = await Team.findById(team._id)
            .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('approved_by', 'profile.full_name employee_id');

        res.status(201).json({
            success: true,
            team: populatedTeam
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all teams (filtered by user role)
// @route   GET /api/teams
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let teams;
        
        if (req.user.role === 'Admin' || req.user.role === 'HR Officer') {
            // Admin/HR can see all teams
            teams = await Team.find({})
                .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('approved_by', 'profile.full_name employee_id')
                .sort({ createdAt: -1 });
        } else {
            // Employees can only see teams they created or are members of
            teams = await Team.find({
                $or: [
                    { created_by: req.user._id },
                    { 'members.user': req.user._id },
                    { team_leader: req.user._id }
                ]
            })
                .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation')
                .populate('approved_by', 'profile.full_name employee_id')
                .sort({ createdAt: -1 });
        }

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get pending teams for approval
// @route   GET /api/teams/pending
// @access  Private/Admin/HR
router.get('/pending', protect, adminOrHR, async (req, res) => {
    try {
        const teams = await Team.find({ status: 'Pending' })
            .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve or reject a team
// @route   PUT /api/teams/:id/status
// @access  Private/Admin/HR
router.put('/:id/status', protect, adminOrHR, async (req, res) => {
    try {
        const { status, rejection_reason } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        team.status = status;
        team.approved_by = req.user._id;
        team.approved_at = new Date();
        
        if (status === 'Rejected' && rejection_reason) {
            team.rejection_reason = rejection_reason;
        }

        await team.save();

        const populatedTeam = await Team.findById(team._id)
            .populate('created_by', 'profile.full_name employee_id email')
            .populate('members', 'profile.full_name employee_id email')
            .populate('approved_by', 'profile.full_name employee_id');

        res.json({
            success: true,
            team: populatedTeam
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single team details
// @route   GET /api/teams/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation profile.phone')
            .populate('approved_by', 'profile.full_name employee_id');

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check access
        const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString());
        const isCreator = team.created_by._id.toString() === req.user._id.toString();
        const isLeader = team.team_leader?._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'HR Officer';

        if (!isMember && !isCreator && !isLeader && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this team' });
        }

        res.json({
            success: true,
            team
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update team members and leader
// @route   PUT /api/teams/:id/members
// @access  Private (Only creator, team leader, or Admin/HR)
router.put('/:id/members', protect, async (req, res) => {
    try {
        const { members, team_leader } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Check authorization
        const isCreator = team.created_by.toString() === req.user._id.toString();
        const isLeader = team.team_leader?.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'HR Officer';

        if (!isCreator && !isLeader && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }

        // Format members with roles
        if (members) {
            const formattedMembers = members.map(member => ({
                user: typeof member === 'object' ? member.user : member,
                role: typeof member === 'object' ? (member.role || 'Member') : 'Member'
            }));
            team.members = formattedMembers;
        }

        if (team_leader) {
            team.team_leader = team_leader;
        }

        await team.save();

        const populatedTeam = await Team.findById(team._id)
            .populate('created_by', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('team_leader', 'profile.full_name employee_id email profile.department profile.designation')
            .populate('members.user', 'profile.full_name employee_id email profile.department profile.designation');

        res.json({
            success: true,
            team: populatedTeam
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (Only creator or Admin/HR)
router.delete('/:id', protect, async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Only creator or Admin/HR can delete
        if (team.created_by.toString() !== req.user._id.toString() && 
            req.user.role !== 'Admin' && req.user.role !== 'HR Officer') {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }

        await Team.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

