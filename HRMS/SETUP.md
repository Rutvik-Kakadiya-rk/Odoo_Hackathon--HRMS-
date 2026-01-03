# Setup Guide - Dayflow HRMS

## Step-by-Step Setup Instructions

### 1. Install Dependencies

Run this command in the root directory to install all dependencies:

```bash
npm run install-all
```

Or manually:
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure MongoDB

**Option A: Local MongoDB**

1. Make sure MongoDB is installed and running
2. Create a `.env` file in the `server` folder:
   ```env
   MONGO_URI=mongodb://localhost:27017/dayflow-hrms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   ```

**Option B: MongoDB Atlas (Cloud)**

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get your connection string
3. Update `.env` file with your Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dayflow-hrms
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   PORT=5000
   NODE_ENV=development
   ```

### 3. Seed Database (Optional but Recommended)

This will create test users for you to login:

```bash
npm run seed
```

**Note:** Make sure MongoDB is running before seeding!

### 4. Start the Application

**Single Command (Recommended):**
```bash
npm start
```

This starts both server and client automatically.

**Or use the start scripts:**
- Windows: `start.bat`
- Linux/Mac: `./start.sh`

**Or start separately:**
```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

### 5. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## Troubleshooting

### Issue: Tailwind CSS Error
**Solution:** Make sure you ran `npm install` in the client folder. The dependencies are now in package.json.

### Issue: MongoDB Connection Error
**Solution:** 
1. Check if MongoDB is running: `mongod` (or check Windows Services)
2. Verify your `MONGO_URI` in `server/.env` is correct
3. For MongoDB Atlas, make sure your IP is whitelisted

### Issue: Port Already in Use
**Solution:** 
- Change server port in `server/.env`: `PORT=5001`
- Change client port in `client/vite.config.js`

### Issue: Seed Script Timeout
**Solution:**
1. Make sure MongoDB is running
2. Check your `MONGO_URI` in `server/.env`
3. Try running seed again: `npm run seed`

## Test Credentials

After seeding:
- **Admin:** admin@dayflow.com / Admin@123
- **HR Officer:** hr@dayflow.com / HR@12345
- **Employee:** john.doe@dayflow.com / Emp@1234

