const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const { protect, admin, adminOrHR } = require('../middleware/authMiddleware');
const { syncLeaves } = require('../utils/syncService');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
router.post('/', protect, async (req, res) => {
    const { leave_type, start_date, end_date, reason, attachment_url } = req.body;

    try {
        const leave = await LeaveRequest.create({
            employee_id: req.user._id,
            leave_type,
            start_date,
            end_date,
            reason,
            attachment_url,
        });
        
        // Sync to local storage in real-time
        await syncLeaves();
        
        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get my leave requests
// @route   GET /api/leaves/my-status
// @access  Private
router.get('/my-status', protect, async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ employee_id: req.user._id });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all leave requests (Admin/HR)
// @route   GET /api/leaves
// @access  Private/Admin/HR
router.get('/', protect, adminOrHR, async (req, res) => {
    try {
        const query = req.query;
        let filter = {};
        
        if (query.status) {
            filter.status = query.status;
        }
        
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
            filter.$or = [
                {
                    start_date: { $gte: new Date(query.startDate), $lte: new Date(query.endDate) }
                },
                {
                    end_date: { $gte: new Date(query.startDate), $lte: new Date(query.endDate) }
                },
                {
                    start_date: { $lte: new Date(query.startDate) },
                    end_date: { $gte: new Date(query.endDate) }
                }
            ];
        }
        
        // Populate employee details
        const leaves = await LeaveRequest.find(filter)
            .populate('employee_id', 'profile.full_name email employee_id profile.profile_picture_url')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve/Reject leave
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin/HR
router.put('/:id/status', protect, adminOrHR, async (req, res) => {
    const { status, admin_remarks } = req.body; // status: 'Approved' or 'Rejected'

    try {
        const leave = await LeaveRequest.findById(req.params.id);

        if (leave) {
            leave.status = status;
            leave.admin_remarks = admin_remarks || leave.admin_remarks;
            const updatedLeave = await leave.save();
            
            // Sync to local storage in real-time
            await syncLeaves();
            
            res.json(updatedLeave);
        } else {
            res.status(404).json({ message: 'Leave request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
