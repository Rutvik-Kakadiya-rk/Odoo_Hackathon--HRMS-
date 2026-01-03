const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOrHR } = require('../middleware/authMiddleware');
const { syncUser } = require('../utils/syncService');
const crypto = require('crypto');

// Generate random password
const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate Employee ID (company-aware if company field exists)
const generateEmployeeId = async (companyId = null) => {
    let query = { role: 'Employee' };
    if (companyId) {
        query.company = companyId;
    }
    const count = await User.countDocuments(query);
    return `EMP${String(count + 1).padStart(4, '0')}`;
};

// @desc    Create new employee (Admin only for HR, Admin/HR for Employees)
// @route   POST /api/employees
// @access  Private/Admin/HR
router.post('/', protect, adminOrHR, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            department,
            designation,
            date_of_joining,
            gender,
            salary_structure,
            team, // Team assignment
            role = 'Employee' // Default to Employee
        } = req.body;

        // Only Admin can create HR Officer profiles
        if (role === 'HR Officer' && req.user.role !== 'Admin') {
            return res.status(403).json({ 
                message: 'Only Admin can create HR Officer profiles' 
            });
        }

        // Validate required fields
        if (!first_name || !last_name || !email || !department || !designation) {
            return res.status(400).json({ 
                message: 'Missing required fields: first_name, last_name, email, department, designation' 
            });
        }

        // For Employees, team is required
        if (role === 'Employee' && !team) {
            return res.status(400).json({ 
                message: 'Team assignment is required for employees' 
            });
        }

        // Validate team exists and is approved (if provided)
        if (team) {
            const Team = require('../models/Team');
            const teamDoc = await Team.findById(team);
            if (!teamDoc) {
                return res.status(400).json({ message: 'Team not found' });
            }
            if (teamDoc.status !== 'Approved') {
                return res.status(400).json({ message: 'Can only assign employees to approved teams' });
            }
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Generate employee ID (company-aware)
        const employee_id = await generateEmployeeId(req.user?.company || null);
        
        // Validate and get password (custom or generate)
        let password = req.body.password;
        
        // If password is provided, validate it
        if (password) {
            const minLength = password.length >= 8;
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            if (!minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
                return res.status(400).json({ 
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
                });
            }
        } else {
            // Generate password if not provided
            password = generatePassword();
        }

        // Calculate salary totals
        const salaryData = salary_structure || {
            basic: 0,
            hra: 0,
            conveyance: 0,
            medical: 0,
            special_allowance: 0,
            pf: 0,
            professional_tax: 0,
            tds: 0,
        };
        
        const gross_salary = salaryData.basic + salaryData.hra + salaryData.conveyance + 
                            salaryData.medical + salaryData.special_allowance;
        const net_salary = gross_salary - salaryData.pf - salaryData.professional_tax - salaryData.tds;

        // Create user
        const user = await User.create({
            employee_id,
            email,
            password, // Will be hashed by pre-save hook
            role: role === 'HR Officer' ? 'HR Officer' : 'Employee',
            email_verified: true,
            team: team || undefined, // Assign to team if provided
            profile: {
                full_name: `${first_name} ${last_name}`,
                first_name,
                last_name,
                phone: phone || '',
                department,
                designation,
                job_title: designation,
                date_of_joining: date_of_joining ? new Date(date_of_joining) : new Date(),
                gender: gender || '',
            },
            salary_structure: {
                ...salaryData,
                gross_salary,
                net_salary,
            }
        });

        // If team is assigned, add employee to team members
        if (team && role === 'Employee') {
            const Team = require('../models/Team');
            await Team.findByIdAndUpdate(team, {
                $push: {
                    members: {
                        user: user._id,
                        role: 'Member',
                        joined_at: new Date()
                    }
                }
            });
        }

        // Sync to local storage in real-time
        await syncUser();

        // Return user with generated credentials (password only shown once)
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee: {
                _id: user._id,
                employee_id: user.employee_id,
                email: user.email,
                full_name: user.profile.full_name,
                department: user.profile.department,
                designation: user.profile.designation,
            },
            credentials: {
                employee_id: user.employee_id,
                email: user.email,
                password: req.body.password ? 'As set during creation' : password, // Show only if auto-generated
                message: req.body.password 
                    ? 'Employee created with custom password.' 
                    : 'Save these credentials. Password will not be shown again.'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all employees with statistics
// @route   GET /api/employees
// @access  Private (All authenticated users can view for team creation)
router.get('/', protect, async (req, res) => {
    try {
        // All users can see employees for team creation, but with limited fields
        const employees = await User.find({ role: 'Employee' })
            .select('_id employee_id email profile.full_name profile.department profile.designation profile.phone profile.profile_picture_url')
            .sort({ 'profile.date_of_joining': -1 });

        res.json({
            success: true,
            count: employees.length,
            employees
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private/Admin/HR
router.get('/stats', protect, adminOrHR, async (req, res) => {
    try {
        const Attendance = require('../models/Attendance');
        const LeaveRequest = require('../models/LeaveRequest');

        const totalEmployees = await User.countDocuments({ role: 'Employee' });
        const totalAdmins = await User.countDocuments({ role: 'Admin' });
        const totalHR = await User.countDocuments({ role: 'HR Officer' });

        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await Attendance.countDocuments({ date: today, status: 'Present' });
        const todayAbsent = await Attendance.countDocuments({ date: today, status: 'Absent' });

        // Pending leave requests
        const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });

        // Department distribution
        const departmentStats = await User.aggregate([
            { $match: { role: 'Employee' } },
            { $group: { _id: '$profile.department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent joinings (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentJoinings = await User.countDocuments({
            role: 'Employee',
            'profile.date_of_joining': { $gte: thirtyDaysAgo }
        });

        res.json({
            success: true,
            stats: {
                totalEmployees,
                totalAdmins,
                totalHR,
                todayAttendance,
                todayAbsent,
                pendingLeaves,
                recentJoinings,
                departmentStats
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

