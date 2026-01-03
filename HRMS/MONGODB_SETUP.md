# MongoDB Atlas Connection - Complete Step-by-Step Guide

## ✅ Step 1: Your MongoDB Atlas Connection String

Your connection string has been updated in `server/.env` file.

**Important:** The password `<Hrms@123>` contains special characters that need to be URL encoded:
- `<` becomes `%3C`
- `@` becomes `%40`
- `>` becomes `%3E`

So your password in the connection string is: `%3CHrms%40123%3E`

## ✅ Step 2: Verify Your .env File

Your `.env` file in the `server` folder should contain:
```
MONGO_URI=mongodb+srv://HRMS:%3CHrms%40123%3E@cluster0.stlulam.mongodb.net/dayflow-hrms?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
```

## ✅ Step 3: MongoDB Atlas Network Access (IMPORTANT!)

**You MUST allow your IP address in MongoDB Atlas:**

1. Go to https://cloud.mongodb.com/
2. Log in to your account
3. Click on your cluster (Cluster0)
4. Click on **"Network Access"** in the left sidebar
5. Click **"Add IP Address"**
6. Click **"Allow Access from Anywhere"** (for testing) OR add your current IP address
7. Click **"Confirm"**

**⚠️ Without this step, your connection will fail!**

## ✅ Step 4: Test the Connection

Run this command to test if MongoDB connection works:
```bash
cd server
npm run seed
```

If you see "✅ Data Imported Successfully!" - your connection is working!

## ✅ Step 5: Start the Application

Once the connection is verified, start your application:

```bash
# From the root folder (E:\HRMS)
npm start
```

Or use the start script:
```bash
start.bat
```

## 🔧 Troubleshooting

### Error: "MongoServerError: Authentication failed"
- Check your username and password are correct
- Make sure password is URL encoded in the connection string

### Error: "MongoServerError: IP not whitelisted"
- Go to MongoDB Atlas → Network Access
- Add your IP address or allow from anywhere

### Error: "Connection timeout"
- Check your internet connection
- Verify the cluster is running in MongoDB Atlas
- Check if your firewall is blocking the connection

## 📝 Quick Reference

- **MongoDB Atlas Dashboard:** https://cloud.mongodb.com/
- **Database Name:** dayflow-hrms
- **Cluster:** Cluster0
- **Username:** HRMS
- **Password:** <Hrms@123> (URL encoded in connection string)

