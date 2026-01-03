const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initFile = (filePath, defaultValue = []) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
    }
};

initFile(USERS_FILE, []);
initFile(ATTENDANCE_FILE, []);
initFile(LEAVES_FILE, []);

// Read from JSON file
const readJSON = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};

// Write to JSON file
const writeJSON = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

// User operations
const userStorage = {
    getAll: () => readJSON(USERS_FILE),
    getById: (id) => {
        const users = readJSON(USERS_FILE);
        return users.find(u => u._id === id || u.employee_id === id);
    },
    getByEmail: (email) => {
        const users = readJSON(USERS_FILE);
        return users.find(u => u.email === email);
    },
    create: (user) => {
        const users = readJSON(USERS_FILE);
        user._id = user._id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        user.createdAt = new Date().toISOString();
        user.updatedAt = new Date().toISOString();
        users.push(user);
        writeJSON(USERS_FILE, users);
        return user;
    },
    update: (id, updates) => {
        const users = readJSON(USERS_FILE);
        const index = users.findIndex(u => u._id === id || u.employee_id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
            writeJSON(USERS_FILE, users);
            return users[index];
        }
        return null;
    },
    delete: (id) => {
        const users = readJSON(USERS_FILE);
        const filtered = users.filter(u => u._id !== id && u.employee_id !== id);
        writeJSON(USERS_FILE, filtered);
        return filtered.length < users.length;
    }
};

// Attendance operations
const attendanceStorage = {
    getAll: () => readJSON(ATTENDANCE_FILE),
    getByEmployeeId: (employeeId) => {
        const attendance = readJSON(ATTENDANCE_FILE);
        return attendance.filter(a => a.employee_id === employeeId);
    },
    getByDate: (date) => {
        const attendance = readJSON(ATTENDANCE_FILE);
        return attendance.filter(a => a.date === date);
    },
    create: (record) => {
        const attendance = readJSON(ATTENDANCE_FILE);
        record._id = record._id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        record.createdAt = new Date().toISOString();
        record.updatedAt = new Date().toISOString();
        attendance.push(record);
        writeJSON(ATTENDANCE_FILE, attendance);
        return record;
    },
    update: (id, updates) => {
        const attendance = readJSON(ATTENDANCE_FILE);
        const index = attendance.findIndex(a => a._id === id);
        if (index !== -1) {
            attendance[index] = { ...attendance[index], ...updates, updatedAt: new Date().toISOString() };
            writeJSON(ATTENDANCE_FILE, attendance);
            return attendance[index];
        }
        return null;
    }
};

// Leave operations
const leaveStorage = {
    getAll: () => readJSON(LEAVES_FILE),
    getByEmployeeId: (employeeId) => {
        const leaves = readJSON(LEAVES_FILE);
        return leaves.filter(l => l.employee_id === employeeId);
    },
    create: (leave) => {
        const leaves = readJSON(LEAVES_FILE);
        leave._id = leave._id || `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        leave.createdAt = new Date().toISOString();
        leave.updatedAt = new Date().toISOString();
        leaves.push(leave);
        writeJSON(LEAVES_FILE, leaves);
        return leave;
    },
    update: (id, updates) => {
        const leaves = readJSON(LEAVES_FILE);
        const index = leaves.findIndex(l => l._id === id);
        if (index !== -1) {
            leaves[index] = { ...leaves[index], ...updates, updatedAt: new Date().toISOString() };
            writeJSON(LEAVES_FILE, leaves);
            return leaves[index];
        }
        return null;
    }
};

// Sync MongoDB data to local storage
const syncToLocal = async (Model, storage, transformFn = (doc) => doc.toObject()) => {
    try {
        const docs = await Model.find({});
        const data = docs.map(transformFn);
        // This will be called periodically to keep local storage in sync
        return data;
    } catch (error) {
        console.error('Error syncing to local storage:', error);
        return [];
    }
};

module.exports = {
    userStorage,
    attendanceStorage,
    leaveStorage,
    syncToLocal,
    DATA_DIR
};

