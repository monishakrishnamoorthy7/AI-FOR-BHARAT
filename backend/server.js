require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

const apiRoutes = require('./routes/api');
const { setupSockets } = require('./sockets/socketManager');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// REST API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Initialize WebSockets
setupSockets(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 EVOS Backend running on http://localhost:${PORT}`);
});
