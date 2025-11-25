require('dotenv').config();

const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// File path for persistent storage
const DATA_FILE = path.join(__dirname, 'message_count.json');

// Load or initialize message count
function loadMessageCount() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.count || 0;
    }
  } catch (error) {
    console.error('Error loading message count:', error);
  }
  return 0;
}

// Save message count to file
function saveMessageCount(count) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ count, lastUpdated: new Date().toISOString() }), 'utf8');
  } catch (error) {
    console.error('Error saving message count:', error);
  }
}

let messageCount = loadMessageCount();

// Create an Express Receiver for the Slack app
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/slack/events'
});

// Initialize the Slack app with the receiver
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// Get the Express app from the receiver
const app = receiver.app;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get current count
app.get('/api/count', (req, res) => {
  res.json({ count: messageCount });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', count: messageCount });
});

// Listen for all messages in channels where the bot is present
slackApp.message(async ({ message }) => {
  // Only count user messages, not bot messages or system messages
  if (message.subtype === undefined || message.subtype === 'file_share') {
    messageCount++;
    saveMessageCount(messageCount);
    
    // Emit the new count to all connected clients
    io.emit('countUpdate', { count: messageCount });
    
    console.log(`Message received! Total count: ${messageCount}`);
  }
});

// Listen for message events (catches all channel messages)
slackApp.event('message', async ({ event }) => {
  // This is a backup handler - the message() handler above should catch most messages
  // but this ensures we don't miss any
  if (!event.subtype || event.subtype === 'file_share') {
    // Note: We don't increment here to avoid double counting
    // The message() listener above handles the increment
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current count to newly connected client
  socket.emit('countUpdate', { count: messageCount });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`⚡️ Server is running on port ${PORT}`);
  console.log(`📊 Current message count: ${messageCount}`);
  console.log(`🌐 Open http://localhost:${PORT} to view the counter`);
});
