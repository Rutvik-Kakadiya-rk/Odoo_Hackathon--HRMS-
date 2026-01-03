const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin, adminOrHR } = require('../middleware/authMiddleware');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            employee_id: user.employee_id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            salary_structure: user.salary_structure,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Employees can only edit limited fields
        if (user.role === 'Employee') {
            if (req.body.phone) user.profile.phone = req.body.phone;
            if (req.body.address) user.profile.address = req.body.address;
            if (req.body.profile_picture_url !== undefined) {
                user.profile.profile_picture_url = req.body.profile_picture_url;
            }
        } else {
            // Admin/HR can edit all fields
            if (req.body.profile) {
                Object.keys(req.body.profile).forEach(key => {
                    const value = req.body.profile[key];
                    // Skip empty strings for enum fields to prevent validation errors
                    if (['gender', 'marital_status'].includes(key) && value === '') {
                        return;
                    }
                    if (value !== undefined) {
                        user.profile[key] = value;
                    }
                });
            }
            // Also handle direct profile_picture_url update
            if (req.body.profile_picture_url !== undefined) {
                user.profile.profile_picture_url = req.body.profile_picture_url;
            }
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.profile.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
            profile: updatedUser.profile,
            salary_structure: updatedUser.salary_structure,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile by ID (Admin/HR only)
// @route   PUT /api/users/:id
// @access  Private/Admin/HR
router.put('/:id', protect, adminOrHR, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        if (req.body.profile) {
            Object.keys(req.body.profile).forEach(key => {
                const value = req.body.profile[key];
                // Skip empty strings for enum fields
                if (['gender', 'marital_status'].includes(key) && value === '') {
                    return;
                }
                if (value !== undefined) {
                    user.profile[key] = value;
                }
            });
        }

        // Update salary structure (Admin/HR only)
        if (req.body.salary_structure) {
            Object.keys(req.body.salary_structure).forEach(key => {
                if (req.body.salary_structure[key] !== undefined) {
                    user.salary_structure[key] = req.body.salary_structure[key];
                }
            });
            // Calculate gross and net salary
            user.salary_structure.gross_salary =
                user.salary_structure.basic +
                user.salary_structure.hra +
                user.salary_structure.conveyance +
                user.salary_structure.medical +
                user.salary_structure.special_allowance;

            user.salary_structure.net_salary =
                user.salary_structure.gross_salary -
                user.salary_structure.pf -
                user.salary_structure.professional_tax -
                user.salary_structure.tds;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.profile.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
            profile: updatedUser.profile,
            salary_structure: updatedUser.salary_structure,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin/HR
router.get('/:id', protect, adminOrHR, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin/HR
router.get('/', protect, adminOrHR, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
