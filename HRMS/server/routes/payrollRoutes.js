const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { protect, adminOrHR } = require('../middleware/authMiddleware');

// @desc    Get payroll for all employees (Admin/HR)
// @route   GET /api/payroll
// @access  Private/Admin/HR
router.get('/', protect, adminOrHR, async (req, res) => {
    try {
        const employees = await User.find({ role: 'Employee' })
            .select('employee_id email profile.full_name profile.department profile.designation profile.profile_picture_url salary_structure')
            .populate('team', 'team_name')
            .sort({ 'profile.department': 1, 'profile.full_name': 1 });

        const payroll = employees.map(emp => ({
            employee_id: emp.employee_id,
            name: emp.profile.full_name,
            department: emp.profile.department,
            designation: emp.profile.designation,
            team: emp.team?.team_name || 'Unassigned',
            profile_picture_url: emp.profile.profile_picture_url,
            gross_salary: emp.salary_structure.gross_salary || 0,
            net_salary: emp.salary_structure.net_salary || 0,
            salary_structure: emp.salary_structure
        }));

        res.json({
            success: true,
            count: payroll.length,
            payroll
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get salary slip for employee
// @route   GET /api/payroll/salary-slip/:employeeId
// @access  Private
router.get('/salary-slip/:employeeId', protect, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month, year } = req.query;

        // Check if user is requesting their own slip or is Admin/HR
        const employee = await User.findOne({ employee_id: employeeId })
            .populate('team', 'team_name team_leader')
            .select('-password');

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Authorization check
        if (req.user.role !== 'Admin' && req.user.role !== 'HR Officer' && 
            req.user.employee_id !== employeeId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get attendance for the month
        let targetMonth, targetYear;
        if (month && year) {
            targetMonth = parseInt(month);
            targetYear = parseInt(year);
        } else {
            const now = new Date();
            targetMonth = now.getMonth() + 1;
            targetYear = now.getFullYear();
        }
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        const attendance = await Attendance.find({
            employee_id: employee._id,
            date: { $gte: startDate, $lte: endDate }
        });

        // Get approved leaves for the month
        const approvedLeaves = await LeaveRequest.find({
            employee_id: employee._id,
            status: 'Approved',
            $or: [
                { start_date: { $gte: startDate, $lte: endDate } },
                { end_date: { $gte: startDate, $lte: endDate } },
                { start_date: { $lte: startDate }, end_date: { $gte: endDate } }
            ]
        });

        // Calculate days on approved leave within the month
        let leaveDays = 0;
        approvedLeaves.forEach(leave => {
            const leaveStart = new Date(Math.max(new Date(leave.start_date).getTime(), startDate.getTime()));
            const leaveEnd = new Date(Math.min(new Date(leave.end_date).getTime(), endDate.getTime()));
            
            // Count days in the month for this leave
            for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
                // Only count Paid and Sick leaves as working days, Unpaid as absent
                if (leave.leave_type === 'Paid' || leave.leave_type === 'Sick') {
                    leaveDays++;
                }
            }
        });

        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const halfDays = attendance.filter(a => a.status === 'Half-day').length;
        const absentDays = attendance.filter(a => a.status === 'Absent').length;
        
        // Working days = Present days + Half days + Approved Paid/Sick leave days
        const workingDays = presentDays + (halfDays * 0.5) + leaveDays;
        const totalDays = new Date(targetYear, targetMonth, 0).getDate();

        // Calculate salary (assuming monthly salary)
        const salary = employee.salary_structure;
        const perDaySalary = salary.gross_salary / totalDays;
        const earnedSalary = perDaySalary * workingDays;
        const deductions = salary.pf + salary.professional_tax + salary.tds;
        const netEarned = earnedSalary - deductions;

        const salarySlip = {
            employee: {
                employee_id: employee.employee_id,
                name: employee.profile.full_name,
                department: employee.profile.department,
                designation: employee.profile.designation,
                team: employee.team?.team_name || 'Unassigned',
                date_of_joining: employee.profile.date_of_joining
            },
            period: {
                month: targetMonth,
                year: targetYear,
                monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
            },
            attendance: {
                total_days: totalDays,
                working_days: Math.round(workingDays * 10) / 10, // Round to 1 decimal
                absent_days: absentDays,
                present_days: presentDays,
                half_days: halfDays,
                leave_days: leaveDays
            },
            earnings: {
                basic: salary.basic,
                hra: salary.hra,
                conveyance: salary.conveyance,
                medical: salary.medical,
                special_allowance: salary.special_allowance,
                gross_salary: salary.gross_salary,
                earned_salary: earnedSalary
            },
            deductions: {
                pf: salary.pf,
                professional_tax: salary.professional_tax,
                tds: salary.tds,
                total_deductions: deductions
            },
            net_salary: netEarned,
            generated_at: new Date()
        };

        res.json({
            success: true,
            salary_slip: salarySlip
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get payroll report (Admin/HR)
// @route   GET /api/payroll/report
// @access  Private/Admin/HR
router.get('/report', protect, adminOrHR, async (req, res) => {
    try {
        const { month, year, department } = req.query;
        let targetMonth, targetYear;
        if (month && year) {
            targetMonth = parseInt(month);
            targetYear = parseInt(year);
        } else {
            const now = new Date();
            targetMonth = now.getMonth() + 1;
            targetYear = now.getFullYear();
        }

        let query = { role: 'Employee' };
        if (department) {
            query['profile.department'] = department;
        }

        const employees = await User.find(query)
            .select('employee_id email profile.full_name profile.department profile.designation profile.profile_picture_url salary_structure')
            .populate('team', 'team_name')
            .sort({ 'profile.department': 1, 'profile.full_name': 1 });

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);
        const totalDays = new Date(targetYear, targetMonth, 0).getDate();

        const report = await Promise.all(employees.map(async (emp) => {
            const attendance = await Attendance.find({
                employee_id: emp._id,
                date: { $gte: startDate, $lte: endDate }
            });

            // Get approved leaves for the month
            const approvedLeaves = await LeaveRequest.find({
                employee_id: emp._id,
                status: 'Approved',
                $or: [
                    { start_date: { $gte: startDate, $lte: endDate } },
                    { end_date: { $gte: startDate, $lte: endDate } },
                    { start_date: { $lte: startDate }, end_date: { $gte: endDate } }
                ]
            });

            // Calculate days on approved leave within the month
            let leaveDays = 0;
            approvedLeaves.forEach(leave => {
                const leaveStart = new Date(Math.max(new Date(leave.start_date).getTime(), startDate.getTime()));
                const leaveEnd = new Date(Math.min(new Date(leave.end_date).getTime(), endDate.getTime()));
                
                for (let d = new Date(leaveStart); d <= leaveEnd; d.setDate(d.getDate() + 1)) {
                    if (leave.leave_type === 'Paid' || leave.leave_type === 'Sick') {
                        leaveDays++;
                    }
                }
            });

            const presentDays = attendance.filter(a => a.status === 'Present').length;
            const halfDays = attendance.filter(a => a.status === 'Half-day').length;
            const workingDays = presentDays + (halfDays * 0.5) + leaveDays;
            
            const perDaySalary = emp.salary_structure.gross_salary / totalDays;
            const earnedSalary = perDaySalary * workingDays;
            const deductions = emp.salary_structure.pf + emp.salary_structure.professional_tax + emp.salary_structure.tds;
            const netEarned = earnedSalary - deductions;

            return {
                employee_id: emp.employee_id,
                name: emp.profile.full_name,
                department: emp.profile.department,
                designation: emp.profile.designation,
                team: emp.team?.team_name || 'Unassigned',
                profile_picture_url: emp.profile.profile_picture_url,
                gross_salary: emp.salary_structure.gross_salary,
                working_days: Math.round(workingDays * 10) / 10,
                earned_salary: earnedSalary,
                deductions,
                net_salary: netEarned
            };
        }));

        const summary = {
            total_employees: report.length,
            total_gross: report.reduce((sum, r) => sum + r.gross_salary, 0),
            total_earned: report.reduce((sum, r) => sum + r.earned_salary, 0),
            total_deductions: report.reduce((sum, r) => sum + r.deductions, 0),
            total_net: report.reduce((sum, r) => sum + r.net_salary, 0)
        };

        res.json({
            success: true,
            period: {
                month: targetMonth,
                year: targetYear,
                monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })
            },
            summary,
            employees: report
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

