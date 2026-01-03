# Dayflow - Human Resource Management System

A comprehensive HRMS solution built with React and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   
   Create a `.env` file in the `server` folder:
   ```env
   MONGO_URI=mongodb://localhost:27017/dayflow-hrms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   ```

3. **Start MongoDB:**
   - If using local MongoDB, make sure MongoDB is running:
     ```bash
     mongod
     ```
   - Or use MongoDB Atlas and update `MONGO_URI` in `.env`

4. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

5. **Start the application:**
   
   **Option 1: Using npm (Recommended)**
   ```bash
   npm start
   ```
   
   **Option 2: Using start script (Windows)**
   ```bash
   start.bat
   ```
   
   **Option 3: Using start script (Linux/Mac)**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   
   This will start both the server (port 5000) and client (port 5173) simultaneously.

## 📋 Test Credentials

After running the seed script:

- **Admin:** `admin@dayflow.com` / `Admin@123`
- **HR Officer:** `hr@dayflow.com` / `HR@12345`
- **Employee:** `john.doe@dayflow.com` / `Emp@1234`

## 🛠️ Available Scripts

- `npm start` or `npm run dev` - Start both server and client
- `npm run server` - Start only the server
- `npm run client` - Start only the client
- `npm run seed` - Seed the database with test data
- `npm run install-all` - Install dependencies for all projects

## 📁 Project Structure

```
HRMS/
├── client/          # React frontend
├── server/          # Node.js backend
└── package.json     # Root package.json with start scripts
```

## 🔧 Troubleshooting

### MongoDB Connection Error
- **Windows:** Make sure MongoDB service is running. You can start it from Services or run `mongod` in a separate terminal
- **Linux/Mac:** Run `mongod` or `sudo systemctl start mongod`
- **Alternative:** Use MongoDB Atlas (free tier available) and update `MONGO_URI` in `.env` to your Atlas connection string
- Default connection: `mongodb://localhost:27017/dayflow-hrms`

### Port Already in Use
- Change the port in `server/.env` or `client/vite.config.js`

### Tailwind CSS Error
- Run `npm install` in the `client` folder to install missing dependencies

## 📝 Features

- ✅ User Authentication (Sign Up / Sign In)
- ✅ Role-based Access Control (Admin, HR Officer, Employee)
- ✅ Employee Profile Management
- ✅ Attendance Tracking (Check-in/Check-out)
- ✅ Leave Management
- ✅ Payroll/Salary Management
- ✅ Admin Dashboard
- ✅ Employee Dashboard

## 🌐 Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

