# Online Multiplayer Chess Game

A fully-featured online chess game with real-time multiplayer, AI opponent, spectator mode, and user accounts.

![Chess Game](preview.png)

## Features

- Beautiful Unicode chess pieces

📊 **Game Features**
- Move history tracking
- Captured pieces display
- Turn indicators
- Connection status
- Game over notifications

## Prerequisites

You need to have **Node.js** installed on your system to run this game.

### Installing Node.js

**On macOS:**
```bash
# Using Homebrew (recommended)
brew install node

# Or download from https://nodejs.org/
```

**On Windows:**
- Download and install from [https://nodejs.org/](https://nodejs.org/)

**On Linux:**
```bash
# Using apt (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm

# Using yum (CentOS/RHEL)
sudo yum install nodejs npm
```

## Installation

1. Navigate to the project directory:
```bash
cd /Users/dedicated2ball/online-chess
```

2. Install dependencies:
```bash
npm install
```

## Running the Game

1. Start the server:
```bash
npm start
```

2. Open your browser and go to:
```
http://localhost:3000
```

3. The server will also show the URL in the console.

## How to Play Online

### Creating a Game
1. Open the game in your browser
2. Click **"Create New Game"**
3. Share the room code with your opponent
4. Wait for them to join

### Joining a Game
1. Get the room code from your opponent
2. Enter the room code in the input field
3. Click **"Join Game"**
4. Start playing!

### Gameplay
- Click a piece to select it (highlighted valid moves will appear)
- Click a highlighted square to move
- White always moves first
- Take turns until checkmate or stalemate

## Playing with Friends Across the Internet

For friends to connect from different locations, you'll need to:

**Option 1: Deploy to a Cloud Service**
- Deploy to services like Heroku, Railway, Render, or DigitalOcean
- Share the deployment URL with friends

**Option 2: Use ngrok (Quick Testing)**
```bash
# Install ngrok: https://ngrok.com/download
npm start

# In another terminal:
ngrok http 3000

# Share the ngrok URL (e.g., https://abc123.ngrok.io)
```

**Option 3: Port Forwarding**
- Set up port forwarding on your router for port 3000
- Share your public IP address with friends
- Note: This has security implications, not recommended for production

## Project Structure

```
online-chess/
├── server.js                 # Node.js server with Socket.io
├── package.json             # Project dependencies
└── public/
    ├── index.html           # Main HTML structure
    ├── style.css            # Premium styling and animations
    ├── chess-game.js        # Chess game logic and rules
    ├── chess-ui.js          # UI controller and rendering
    └── multiplayer-client.js # Socket.io client integration
```

## Technology Stack

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **better-sqlite3** - SQLite database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication

### Frontend
- **Vanilla HTML/CSS/JavaScript** - Core web technologies
- **Real-time Communication**: WebSocket via Socket.io
- **Styling**: Custom CSS with modern design patterns

## Future Enhancements

Based on user feedback, planned features in priority order:

1. **Chess clock/timers** - Add time controls for competitive play
2. **AI opponent** - Play against computer when no opponent available
3. **Spectator mode** - Allow others to watch games in progress
4. **User accounts** - Save player profiles and preferences
5. **Game history** - Replay and analyze previous games

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Can't connect to server:**
- Make sure the server is running
- Check that port 3000 is not blocked by firewall
- Verify you're using the correct URL

**Moves not syncing:**
- Check browser console for errors
- Ensure both players have stable internet connection
- Refresh both browsers and rejoin the room

## License

MIT License - Feel free to use and modify for your own projects!

## Credits

Created with ❤️ using vanilla JavaScript and modern web technologies.
