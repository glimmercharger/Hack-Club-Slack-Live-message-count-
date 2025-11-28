# Hack Club Slack Live Message Counter 🚀

A real-time dashboard that displays a live count of messages sent on the Hack Club Slack workspace. The counter updates instantly when new messages are sent!

![Live Counter Preview](https://img.shields.io/badge/Status-Live-brightgreen)

## Features

- 📊 **Live Message Count**: Displays the total number of messages with real-time updates
- ⚡ **WebSocket Updates**: Counter updates instantly when new messages are received
- 💾 **Persistent Storage**: Message count is saved and persists across server restarts
- 🎨 **Beautiful UI**: Hack Club themed design with smooth animations
- 🔄 **Auto-reconnect**: Automatically reconnects if the connection drops
- 🤖 **Auto-join Channels**: Bot automatically joins all public channels on startup

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
- `channels:join` - **Required**: Join public channels automatically
- `channels:read` - **Required**: List all public channels
- `channels:history` - **Required**: View messages in public channels

### 3. Enable Event Subscriptions

1. Go to **Event Subscriptions**
2. Turn on **Enable Events**
3. Set the **Request URL** to: `https://your-domain.com/slack/events`
4. Under **Subscribe to bot events**, add:
   - `message.channels` - Messages in public channels

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

The bot will automatically join all public channels when it starts up! 🎉

## GitHub Pages Deployment

You can host the frontend on GitHub Pages and run the backend on a separate server.

### Step 1: Deploy the Backend

Deploy the backend to any Node.js hosting platform:
- **Railway**: Connect your GitHub repo
- **Render**: Connect your GitHub repo
- **Heroku**: `git push heroku main`
- **DigitalOcean**: App Platform or Droplet

Make sure to set your environment variables (`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`).

### Step 2: Configure GitHub Pages

1. Edit `docs/index.html` and replace `YOUR_BACKEND_URL_HERE` with your deployed backend URL:
   ```javascript
   const BACKEND_URL = 'https://your-backend-server.com';
   ```

2. Go to your GitHub repo → **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select the **main** branch and **/docs** folder
5. Click **Save**

Your counter will be live at `https://yourusername.github.io/your-repo-name/`

## Local Development

### Using ngrok (for local testing)

```bash
ngrok http 3000
```

Then update your Slack app's Request URL to `https://your-ngrok-url.ngrok.io/slack/events`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | HTML page with live counter |
| `GET /api/count` | JSON response with current count |
| `GET /api/health` | Health check endpoint |
| `POST /slack/events` | Slack Events API endpoint |

## How It Works

1. **Auto-join**: On startup, the bot automatically joins all public channels in the workspace
2. **Slack Events API**: When a message is sent in Slack, Slack sends an event to our server
3. **Message Counter**: The server increments the count and saves it to a file
4. **WebSocket (Socket.io)**: The new count is broadcast to all connected browsers
5. **Live Update**: The browser receives the update and displays the new count instantly

## Tech Stack

- **Backend**: Node.js, Express
- **Slack Integration**: @slack/bolt
- **Real-time Updates**: Socket.io
- **Frontend**: HTML, CSS, JavaScript

## License

MIT License - see [LICENSE](LICENSE) file
