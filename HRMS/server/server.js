const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const app = express();

// Connect to database
connectDB().then(() => {
    // Start auto-sync to local storage after successful connection
    const { startAutoSync } = require('./utils/syncService');
    startAutoSync(5); // Sync every 5 minutes
}).catch((error) => {
    console.error('Failed to connect to MongoDB. Server will continue but database operations will fail.');
    console.error('Please ensure MongoDB is running and MONGO_URI is correct in .env file');
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Dayflow HRMS API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
