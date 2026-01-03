# Dayflow HRMS

Dayflow is a modern, full-stack Human Resource Management System (HRMS) built with the MERN stack (MongoDB, Express, React, Node.js). It provides a comprehensive solution for managing employee attendance, leaves, and profiles with a role-based architecture.

## 🚀 Features

*   **Role-Based Access Control**: Separate dashboards for Admins and Employees.
*   **Attendance Tracking**: One-click Check-In/Check-Out with real-time status updates and working hour calculation.
*   **Leave Management**: 
    *   Employees can apply for different types of leaves (Paid, Sick, Unpaid).
    *   Admins can review requests and Approve/Reject them.
*   **Employee Directory**: Admins can view a list of all employees.
*   **Modern UI**: Built with Tailwind CSS, featuring a responsive and clean design (Glassmorphism inspired).

## 🛠 Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, Lucide React (Icons), Axios.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose ODM).
*   **Authentication**: JSON Web Tokens (JWT).

## 📦 Prerequisites

Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v14+)
*   [MongoDB](https://www.mongodb.com/try/download/community) (running locally or via Atlas)

## ⚡ Quick Start Guide

### 1. Setup Backend
```bash
cd server
npm install
# Create .env file if missing (PORT=5000, MONGO_URI=..., JWT_SECRET=...)
# Seed the database with default users
node seed.js
# Start the server
npm run dev
```

### 2. Setup Frontend
```bash
# Open a new terminal
cd client
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

## 🔑 Default Credentials

Use these credentials to log in (created via `node seed.js`):

| Role | Email | Password |
|Str|Str|Str|
| **Admin** | `admin@example.com` | `password123` |
| **Employee** | `employee@example.com` | `password123` |

## 🔧 Troubleshooting

*   **CSS Not Working?**: Check if `postcss.config.js` exists in the `client` folder. If not, create it with tailwind/autoprefixer plugins. (This is already fixed in the current codebase).
*   **Database Connection Error**: Ensure MongoDB service is running (`mongod`). Check `MONGO_URI` in `server/.env`.
