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

// Initialize Socket.io with CORS for GitHub Pages
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for API endpoints (needed for GitHub Pages and cross-origin access)
// Note: Wildcard is intentional - this is a public read-only counter API
// For more restrictive use, set ALLOWED_ORIGINS env var (comma-separated domains)
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  const origin = req.headers.origin;
  
  if (allowedOrigins) {
    const origins = allowedOrigins.split(',').map(o => o.trim());
    if (origins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// API endpoint to get current count
app.get('/api/count', (req, res) => {
  res.json({ count: messageCount });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', count: messageCount });
});

// Function to join all public channels in the workspace
async function joinAllChannels() {
  console.log('🔄 Attempting to join all public channels...');
  
  try {
    let cursor;
    let totalJoined = 0;
    let totalAlreadyIn = 0;
    
    do {
      // Get list of all public channels
      const result = await slackApp.client.conversations.list({
        token: process.env.SLACK_BOT_TOKEN,
        types: 'public_channel',
        limit: 200,
        cursor: cursor
      });
      
      for (const channel of result.channels) {
        if (!channel.is_member) {
          try {
            await slackApp.client.conversations.join({
              token: process.env.SLACK_BOT_TOKEN,
              channel: channel.id
            });
            console.log(`✅ Joined #${channel.name}`);
            totalJoined++;
            // Delay to respect Slack API rate limits (Tier 3: ~50 requests per minute)
            await new Promise(resolve => setTimeout(resolve, 1200));
          } catch (joinError) {
            // Skip channels we can't join (archived, restricted, etc.)
            if (joinError.data?.error !== 'is_archived') {
              console.log(`⚠️ Could not join #${channel.name}: ${joinError.data?.error || joinError.message}`);
            }
          }
        } else {
          totalAlreadyIn++;
        }
      }
      
      cursor = result.response_metadata?.next_cursor;
    } while (cursor);
    
    console.log(`📊 Channel join complete: ${totalJoined} new channels joined, ${totalAlreadyIn} already a member`);
  } catch (error) {
    console.error('❌ Error joining channels:', error.message);
  }
}

// Listen for all messages in channels where the bot is present
slackApp.message(async ({ message }) => {
  // Only count user messages from public channels, not bot messages or system messages
  // channel_type: 'channel' = public channel, 'im' = DM, 'mpim' = group DM, 'group' = private channel
  if ((message.subtype === undefined || message.subtype === 'file_share') && message.channel_type === 'channel') {
    messageCount++;
    saveMessageCount(messageCount);
    
    // Emit the new count to all connected clients
    io.emit('countUpdate', { count: messageCount });
    
    console.log(`Message received in public channel! Total count: ${messageCount}`);
  }
});

// Listen for message events (catches all channel messages)
slackApp.event('message', async ({ event }) => {
  // This is a backup handler - the message() handler above should catch most messages
  // but this ensures we don't miss any from public channels only
  // channel_type: 'channel' = public channel, 'im' = DM, 'mpim' = group DM, 'group' = private channel
  if ((!event.subtype || event.subtype === 'file_share') && event.channel_type === 'channel') {
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
server.listen(PORT, async () => {
  console.log(`⚡️ Server is running on port ${PORT}`);
  console.log(`📊 Current message count: ${messageCount}`);
  console.log(`🌐 Open http://localhost:${PORT} to view the counter`);
  
  // Auto-join all channels on startup
  await joinAllChannels();
});
