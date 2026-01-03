const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        };
        
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dayflow-hrms', options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('\n💡 Make sure MongoDB is running on your system.');
        console.error('   You can start it with: mongod (or use MongoDB Atlas)');
        throw error;
    }
};

module.exports = connectDB;
