const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { protect, adminOrHR } = require('../middleware/authMiddleware');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin/HR
router.get('/dashboard', protect, adminOrHR, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

        // Employee counts
        const totalEmployees = await User.countDocuments({ role: 'Employee' });
        const activeEmployees = await User.countDocuments({ 
            role: 'Employee',
            'profile.date_of_joining': { $lte: new Date() }
        });

        // Today's attendance
        const todayPresent = await Attendance.countDocuments({ date: today, status: 'Present' });
        const todayAbsent = await Attendance.countDocuments({ date: today, status: 'Absent' });
        const todayOnLeave = await Attendance.countDocuments({ date: today, status: 'Leave' });
        const todayHalfDay = await Attendance.countDocuments({ date: today, status: 'Half-day' });

        // Monthly attendance stats
        const monthlyAttendance = await Attendance.aggregate([
            { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Leave statistics
        const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
        const approvedLeaves = await LeaveRequest.countDocuments({ status: 'Approved' });
        const rejectedLeaves = await LeaveRequest.countDocuments({ status: 'Rejected' });

        // Department distribution
        const departmentStats = await User.aggregate([
            { $match: { role: 'Employee' } },
            { $group: { _id: '$profile.department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Attendance rate calculation
        const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const daysPassed = new Date().getDate();
        const expectedAttendance = totalEmployees * daysPassed;
        const actualAttendance = await Attendance.countDocuments({ 
            date: { $gte: startOfMonth, $lte: today },
            status: 'Present' 
        });
        const attendanceRate = expectedAttendance > 0 ? ((actualAttendance / expectedAttendance) * 100).toFixed(1) : 0;

        // Recent activities
        const recentLeaves = await LeaveRequest.find({})
            .populate('employee_id', 'profile.full_name employee_id')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentAttendances = await Attendance.find({})
            .populate('employee_id', 'profile.full_name employee_id')
            .sort({ createdAt: -1 })
            .limit(5);

        // Gender distribution
        const genderStats = await User.aggregate([
            { $match: { role: 'Employee' } },
            { $group: { _id: '$profile.gender', count: { $sum: 1 } } }
        ]);

        // Leave type distribution
        const leaveTypeStats = await LeaveRequest.aggregate([
            { $group: { _id: '$leave_type', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            analytics: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees
                },
                todayAttendance: {
                    present: todayPresent,
                    absent: todayAbsent,
                    onLeave: todayOnLeave,
                    halfDay: todayHalfDay,
                    total: todayPresent + todayAbsent + todayOnLeave + todayHalfDay
                },
                monthlyStats: {
                    attendanceRate: parseFloat(attendanceRate),
                    totalDays: totalDaysInMonth,
                    daysPassed: daysPassed,
                    actualAttendance: actualAttendance,
                    expectedAttendance: expectedAttendance
                },
                leaves: {
                    pending: pendingLeaves,
                    approved: approvedLeaves,
                    rejected: rejectedLeaves,
                    total: pendingLeaves + approvedLeaves + rejectedLeaves
                },
                departmentStats,
                genderStats,
                leaveTypeStats,
                recentActivities: {
                    leaves: recentLeaves,
                    attendance: recentAttendances
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get employee analytics
// @route   GET /api/analytics/employees
// @access  Private/Admin/HR
router.get('/employees', protect, adminOrHR, async (req, res) => {
    try {
        const employees = await User.find({ role: 'Employee' })
            .select('employee_id profile email')
            .lean();

        const employeeStats = await Promise.all(
            employees.map(async (emp) => {
                const attendanceCount = await Attendance.countDocuments({ 
                    employee_id: emp._id,
                    status: 'Present'
                });
                const leaveCount = await LeaveRequest.countDocuments({ 
                    employee_id: emp._id,
                    status: 'Approved'
                });
                const pendingLeaves = await LeaveRequest.countDocuments({ 
                    employee_id: emp._id,
                    status: 'Pending'
                });

                return {
                    ...emp,
                    attendanceCount,
                    leaveCount,
                    pendingLeaves
                };
            })
        );

        res.json({
            success: true,
            employees: employeeStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get attendance trends
// @route   GET /api/analytics/attendance-trends
// @access  Private/Admin/HR
router.get('/attendance-trends', protect, adminOrHR, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const trends = await Attendance.aggregate([
            { $match: { date: { $gte: startDateStr } } },
            { $group: { 
                _id: { date: '$date', status: '$status' },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.date': 1 } }
        ]);

        res.json({
            success: true,
            trends
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get daily employee data (all employees' daily activities)
// @route   GET /api/analytics/daily-data
// @access  Private/Admin/HR
router.get('/daily-data', protect, adminOrHR, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        // Get all employees
        const employees = await User.find({ role: 'Employee' })
            .select('employee_id email profile')
            .lean();

        // Get today's attendance for all employees
        const todayAttendance = await Attendance.find({ date: targetDate })
            .populate('employee_id', 'employee_id email profile.full_name profile.department')
            .lean();

        // Get today's leave requests
        const todayLeaves = await LeaveRequest.find({
            $or: [
                { start_date: { $lte: targetDate }, end_date: { $gte: targetDate } },
                { start_date: targetDate }
            ]
        })
            .populate('employee_id', 'employee_id email profile.full_name profile.department')
            .lean();

        // Create a map of employee activities
        const employeeDailyData = employees.map(emp => {
            const attendance = todayAttendance.find(a => 
                a.employee_id?._id?.toString() === emp._id.toString() || 
                a.employee_id?.toString() === emp._id.toString()
            );
            
            const leave = todayLeaves.find(l => 
                l.employee_id?._id?.toString() === emp._id.toString() || 
                l.employee_id?.toString() === emp._id.toString()
            );

            return {
                employee_id: emp.employee_id,
                employee_name: emp.profile?.full_name || 'N/A',
                email: emp.email,
                department: emp.profile?.department || 'N/A',
                attendance: attendance ? {
                    status: attendance.status,
                    check_in: attendance.check_in,
                    check_out: attendance.check_out,
                    total_hours: attendance.total_hours
                } : null,
                leave: leave ? {
                    leave_type: leave.leave_type,
                    status: leave.status,
                    start_date: leave.start_date,
                    end_date: leave.end_date,
                    reason: leave.reason
                } : null,
                daily_status: attendance?.status || leave?.status || 'Absent'
            };
        });

        // Summary statistics
        const summary = {
            total_employees: employees.length,
            present: employeeDailyData.filter(e => e.daily_status === 'Present').length,
            absent: employeeDailyData.filter(e => e.daily_status === 'Absent').length,
            on_leave: employeeDailyData.filter(e => e.leave && e.leave.status === 'Approved').length,
            half_day: employeeDailyData.filter(e => e.daily_status === 'Half-day').length,
            checked_in: employeeDailyData.filter(e => e.attendance?.check_in).length,
            checked_out: employeeDailyData.filter(e => e.attendance?.check_out).length
        };

        res.json({
            success: true,
            date: targetDate,
            summary,
            employees: employeeDailyData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

