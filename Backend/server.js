const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);

// *** Your Vercel Frontend URL (Used for CORS) ***
// NOTE: Replace this with your actual Vercel domain in production, 
// or set it via environment variables on Render.
const VERCEL_FRONTEND_URL = 'https://audience-query-management-response.vercel.app'; 
const LOCAL_DEV_URL = 'http://localhost:3000';

// Determine the correct origin based on environment
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? VERCEL_FRONTEND_URL 
    : [LOCAL_DEV_URL, VERCEL_FRONTEND_URL, '*']; // Use array for development flexibility

// --- 1. Real-Time Setup (Socket.io) ---
const io = socketIo(server, {
    cors: {
        // Robust CORS for both local testing and production Vercel frontend
        origin: allowedOrigins, 
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// --- 2. MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI; 
mongoose.connect(MONGO_URI, { 
    // *** FIX 1: Force IPv4 for stable Atlas connection on Render ***
    family: 4 
})
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err)); // Check Render logs for this error!

// --- 3. Express Middleware ---
// CORS for the REST API calls
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Add socket.io instance to the app object for access in routes
app.set('socketio', io); 

// Placeholder for Routes
app.use('/api/queries', require('./routes/queryRoutes'));

// Note: Render will inject its required PORT via process.env.PORT (e.g., 10000)
const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));