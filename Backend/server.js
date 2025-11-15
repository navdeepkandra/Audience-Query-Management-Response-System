const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: '*', 
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.set('socketio', io); 
app.use('/api/queries', require('./routes/queryRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));