# Hack Club Slack Live Message Counter 🚀

A real-time dashboard that displays a live count of messages sent on the Hack Club Slack workspace. The counter updates instantly when new messages are sent!

![Live Counter Preview](https://img.shields.io/badge/Status-Live-brightgreen)

## Features

- 📊 **Live Message Count**: Displays the total number of messages with real-time updates
- ⚡ **WebSocket Updates**: Counter updates instantly when new messages are received
- 💾 **Persistent Storage**: Message count is saved and persists across server restarts
- 🎨 **Beautiful UI**: Hack Club themed design with smooth animations
- 🔄 **Auto-reconnect**: Automatically reconnects if the connection drops

## Prerequisites

- Node.js 18+ installed
- A Slack workspace (Hack Club Slack)
- A Slack Bot with appropriate permissions

## Setup Instructions

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name your app and select your workspace

### 2. Configure Bot Permissions

Go to **OAuth & Permissions** and add these **Bot Token Scopes**:
- `channels:history` - View messages in public channels
- `channels:read` - View basic channel info
- `groups:history` - View messages in private channels (if needed)
- `groups:read` - View basic private channel info (if needed)
- `im:history` - View direct messages (if needed)
- `mpim:history` - View group DMs (if needed)

### 3. Enable Event Subscriptions

1. Go to **Event Subscriptions**
2. Turn on **Enable Events**
3. Set the **Request URL** to: `https://your-domain.com/slack/events`
4. Under **Subscribe to bot events**, add:
   - `message.channels` - Messages in public channels
   - `message.groups` - Messages in private channels (optional)
   - `message.im` - Direct messages (optional)
   - `message.mpim` - Group DMs (optional)

### 4. Install the App

1. Go to **Install App** in the sidebar
2. Click **Install to Workspace**
3. Authorize the app

### 5. Get Your Credentials

- **Bot Token**: Found in **OAuth & Permissions** (starts with `xoxb-`)
- **Signing Secret**: Found in **Basic Information** → **App Credentials**

### 6. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
PORT=3000
```

### 7. Install Dependencies & Run

```bash
npm install
npm start
```

### 8. Add the Bot to Channels

Invite your bot to channels where you want to count messages:
- In Slack, go to the channel
- Type `/invite @YourBotName`

## Deployment

### Using ngrok (for local testing)

```bash
ngrok http 3000
```

Then update your Slack app's Request URL to `https://your-ngrok-url.ngrok.io/slack/events`

### Production Deployment

Deploy to any Node.js hosting platform:
- **Heroku**: `git push heroku main`
- **Railway**: Connect your GitHub repo
- **Render**: Connect your GitHub repo
- **Vercel**: Use serverless configuration
- **DigitalOcean**: App Platform or Droplet

Make sure to:
1. Set environment variables on your hosting platform
2. Update the Slack app's Request URL to your production URL

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | HTML page with live counter |
| `GET /api/count` | JSON response with current count |
| `GET /api/health` | Health check endpoint |
| `POST /slack/events` | Slack Events API endpoint |

## How It Works

1. **Slack Events API**: When a message is sent in Slack, Slack sends an event to our server
2. **Message Counter**: The server increments the count and saves it to a file
3. **WebSocket (Socket.io)**: The new count is broadcast to all connected browsers
4. **Live Update**: The browser receives the update and displays the new count instantly

## Tech Stack

- **Backend**: Node.js, Express
- **Slack Integration**: @slack/bolt
- **Real-time Updates**: Socket.io
- **Frontend**: HTML, CSS, JavaScript

## License

MIT License - see [LICENSE](LICENSE) file
