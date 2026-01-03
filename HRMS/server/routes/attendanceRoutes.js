const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, admin, adminOrHR } = require('../middleware/authMiddleware');
const { syncAttendance } = require('../utils/syncService');

// @desc    Get today's attendance status for current user
// @route   GET /api/attendance/today
// @access  Private
router.get('/today', protect, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const attendance = await Attendance.findOne({
            employee_id: req.user._id,
            date: today,
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check In
// @route   POST /api/attendance/checkin
// @access  Private
router.post('/checkin', protect, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const existing = await Attendance.findOne({
            employee_id: req.user._id,
            date: today,
        });

        if (existing) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        const attendance = await Attendance.create({
            employee_id: req.user._id,
            date: today,
            check_in: new Date(),
            status: 'Present',
        });

        // Sync to local storage in real-time
        await syncAttendance();

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Check Out
// @route   PUT /api/attendance/checkout
// @access  Private
router.put('/checkout', protect, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const attendance = await Attendance.findOne({
            employee_id: req.user._id,
            date: today,
        });

        if (!attendance) {
            return res.status(404).json({ message: 'No check-in record found for today' });
        }

        attendance.check_out = new Date();

        // Calculate total hours
        const duration = attendance.check_out - attendance.check_in; // in ms
        attendance.total_hours = (duration / (1000 * 60 * 60)).toFixed(2);

        const updatedAttendance = await attendance.save();
        
        // Sync to local storage in real-time
        await syncAttendance();
        
        res.json(updatedAttendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get attendance history (all for admin/hr, self for employee)
// @route   GET /api/attendance
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let attendance;
        const query = req.query;
        
        if (req.user.role === 'Admin' || req.user.role === 'HR Officer') {
            let filter = {};
            
            // Support both employee_id (ObjectId) and employeeId (string ID)
            if (query.employeeId) {
                const User = require('../models/User');
                const employee = await User.findOne({ employee_id: query.employeeId });
                if (employee) {
                    filter.employee_id = employee._id;
                }
            } else if (query.employee_id) {
                const User = require('../models/User');
                const employee = await User.findById(query.employee_id);
                if (employee) {
                    filter.employee_id = employee._id;
                }
            }
            
            // Date range filtering
            if (query.startDate && query.endDate) {
                filter.date = {
                    $gte: new Date(query.startDate),
                    $lte: new Date(query.endDate)
                };
            } else if (query.date) {
                filter.date = query.date;
            } else if (query.month) {
                const [year, month] = query.month.split('-');
                filter.date = { $regex: `^${year}-${month}` };
            }
            
            attendance = await Attendance.find(filter)
                .populate('employee_id', 'profile.full_name email employee_id profile.profile_picture_url')
                .sort({ date: -1 });
        } else {
            let filter = { employee_id: req.user._id };
            
            // Date range filtering for employees
            if (query.startDate && query.endDate) {
                filter.date = {
                    $gte: new Date(query.startDate),
                    $lte: new Date(query.endDate)
                };
            } else if (query.date) {
                filter.date = query.date;
            } else if (query.month) {
                const [year, month] = query.month.split('-');
                filter.date = { $regex: `^${year}-${month}` };
            }
            
            attendance = await Attendance.find(filter).sort({ date: -1 });
        }
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
