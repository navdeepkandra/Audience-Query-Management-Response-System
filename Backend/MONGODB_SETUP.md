# MongoDB Setup Guide

## Option 1: Start Local MongoDB (Requires Admin)

1. Open PowerShell as Administrator
2. Run: `Start-Service MongoDB`
3. Verify: `Get-Service MongoDB` (should show "Running")

## Option 2: Use MongoDB Atlas (Cloud - Free)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account

### Step 2: Create Cluster
1. Click "Build a Database"
2. Choose "FREE" (M0) tier
3. Select a cloud provider and region (closest to you)
4. Click "Create"

### Step 3: Setup Database Access
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Set privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### Step 4: Setup Network Access
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your current IP address
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name (e.g., `query_manager`)

### Step 6: Update .env File
Update your `Backend/.env` file:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/query_manager?retryWrites=true&w=majority
PORT=5000
```

Replace:
- `<username>` with your database username
- `<password>` with your database password
- `cluster0.xxxxx` with your actual cluster address

## Verify Connection

After setting up either option, restart your server:
```powershell
cd Backend
node server.js
```

You should see: `✅ MongoDB connected successfully!`

