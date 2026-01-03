const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const { userStorage, attendanceStorage, leaveStorage } = require('./localStorage');
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');

// Sync MongoDB data to local JSON storage
const syncAllData = async () => {
    try {
        console.log('🔄 Syncing data to local storage...');

        // Sync Users
        const users = await User.find({}).lean();
        const usersData = users.map(user => ({
            ...user,
            _id: user._id.toString(),
            employee_id: user.employee_id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            salary_structure: user.salary_structure,
            team: user.team?.toString() || null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        
        // Write to local storage
        const fs = require('fs');
        const path = require('path');
        const DATA_DIR = path.join(__dirname, '../../data');
        const USERS_FILE = path.join(DATA_DIR, 'users.json');
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf8');

        // Sync Attendance
        const attendance = await Attendance.find({}).populate('employee_id', 'employee_id profile.full_name').lean();
        const attendanceData = attendance.map(record => ({
            ...record,
            _id: record._id.toString(),
            employee_id: record.employee_id?._id?.toString() || record.employee_id?.toString(),
            date: record.date,
            status: record.status,
            check_in: record.check_in,
            check_out: record.check_out,
            total_hours: record.total_hours
        }));
        
        const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendanceData, null, 2), 'utf8');

        // Sync Leaves
        const leaves = await LeaveRequest.find({}).populate('employee_id', 'employee_id profile.full_name').lean();
        const leavesData = leaves.map(leave => ({
            ...leave,
            _id: leave._id.toString(),
            employee_id: leave.employee_id?._id?.toString() || leave.employee_id?.toString(),
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            status: leave.status,
            reason: leave.reason
        }));
        
        const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');
        fs.writeFileSync(LEAVES_FILE, JSON.stringify(leavesData, null, 2), 'utf8');

        console.log('✅ Data synced to local storage successfully');
        return { success: true, counts: { users: users.length, attendance: attendance.length, leaves: leaves.length } };
    } catch (error) {
        console.error('❌ Error syncing data:', error);
        return { success: false, error: error.message };
    }
};

// Auto-sync every 5 minutes
let syncInterval = null;

const startAutoSync = (intervalMinutes = 5) => {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // Initial sync
    syncAllData();
    
    // Schedule periodic sync
    syncInterval = setInterval(() => {
        syncAllData();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`🔄 Auto-sync enabled (every ${intervalMinutes} minutes)`);
};

const stopAutoSync = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
        console.log('⏸️ Auto-sync disabled');
    }
};

// Real-time sync functions - call these after create/update/delete operations
const syncUser = async (userId = null) => {
    try {
        const users = await User.find({}).lean();
        const usersData = users.map(user => ({
            ...user,
            _id: user._id.toString(),
            employee_id: user.employee_id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            salary_structure: user.salary_structure,
            team: user.team?.toString() || null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error syncing user:', error);
        return false;
    }
};

const syncAttendance = async () => {
    try {
        const attendance = await Attendance.find({}).populate('employee_id', 'employee_id profile.full_name').lean();
        const attendanceData = attendance.map(record => ({
            ...record,
            _id: record._id.toString(),
            employee_id: record.employee_id?._id?.toString() || record.employee_id?.toString(),
            date: record.date,
            status: record.status,
            check_in: record.check_in,
            check_out: record.check_out,
            total_hours: record.total_hours
        }));
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(attendanceData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error syncing attendance:', error);
        return false;
    }
};

const syncLeaves = async () => {
    try {
        const leaves = await LeaveRequest.find({}).populate('employee_id', 'employee_id profile.full_name').lean();
        const leavesData = leaves.map(leave => ({
            ...leave,
            _id: leave._id.toString(),
            employee_id: leave.employee_id?._id?.toString() || leave.employee_id?.toString(),
            leave_type: leave.leave_type,
            start_date: leave.start_date,
            end_date: leave.end_date,
            status: leave.status,
            reason: leave.reason
        }));
        fs.writeFileSync(LEAVES_FILE, JSON.stringify(leavesData, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error syncing leaves:', error);
        return false;
    }
};

module.exports = {
    syncAllData,
    startAutoSync,
    stopAutoSync,
    syncUser,
    syncAttendance,
    syncLeaves
};

