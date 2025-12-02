# ♟️ Online Multiplayer Chess

A feature-rich, real-time online chess game with AI opponent, spectator mode, chess timers, and user accounts. Play against friends across the internet or challenge the computer!

**🌐 Live Demo:** [https://online-chess203.onrender.com/](https://online-chess203.onrender.com/)

---

## ✨ Features

### 🎮 Game Modes
- **💻 Play vs Computer** - Challenge an AI opponent with adjustable difficulty (Easy, Medium, Hard)
- **👥 Multiplayer** - Play against friends in real-time with room codes
- **👁️ Spectator Mode** - Watch live games in progress

### ⚡ Gameplay Features
- **♟️ Full Chess Rules** - All standard chess moves including castling, en passant, and pawn promotion
- **⏱️ Chess Timers** - Multiple time controls (Bullet, Blitz, Rapid, Classical)
- **📜 Move History** - Complete notation of all moves made
- **🎯 Captured Pieces** - Visual display of captured pieces for both players
- **✅ Valid Move Indicators** - Green dots show legal moves when you select a piece
- **🔔 Check & Checkmate Detection** - Automatic game state detection
- **🏳️ Surrender Option** - Give up gracefully when the position is lost

### 👤 User Features
- **🔐 User Accounts** - Register and login to track your games
- **📊 Player Stats** - Track wins, losses, and draws
- **🏆 Leaderboard** - See top-rated players
- **📖 Game History** - Review your past games

### 🎨 Design
- **🌙 Modern Dark Theme** - Beautiful, easy-on-the-eyes interface
- **♟️ Unicode Chess Pieces** - Clear, professional piece representation
- **📱 Responsive Design** - Works on desktop and mobile devices
- **✨ Smooth Animations** - Polished user experience

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)

### Installation

1. **Clone or download** this repository
2. **Navigate** to the project directory:
   ```bash
   cd online-chess
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

### Running Locally

1. **Start the server**:
   ```bash
   npm start
   ```
2. **Open your browser** to:
   ```
   http://localhost:3000
   ```

---

## 🎯 How to Play

### 🤖 Playing Against the Computer

1. Click **"Play vs Computer"** on the main screen
2. Select AI difficulty: **Easy**, **Medium**, or **Hard**
3. Choose a time control (or select "No timer" for unlimited time)
4. Click **"Start AI Game"**
5. **Make your moves:**
   - Click on one of your pieces (you play as White)
   - **Green dots** will appear showing valid moves
   - Click on a green dot to move your piece
6. Wait for the AI to respond
7. Continue until checkmate, stalemate, or timeout!

### 👥 Playing Against a Friend (Same Network)

1. **Player 1:** Click **"Create New Game"**
2. Share the **room code** that appears
3. **Player 2:** Enter the room code and click **"Join Game"**
4. Start playing! White moves first
5. **Making moves:**
   - Click on your piece to select it
   - Click on a **green dot** (valid move) to move the piece
   - Wait for your opponent's move

### 🌐 Playing Across the Internet

To play with friends remotely, you have three options:

**Option 1: Use the Deployed Version (Easiest)**
- Just share this link: **https://online-chess203.onrender.com/**
- Both players open the link and use room codes to connect

**Option 2: Deploy Your Own (Recommended)**
- Deploy to **Render**, **Railway**, or **Heroku** (see Deployment section below)
- Share your deployment URL with friends

**Option 3: Use ngrok (Quick Testing)**
```bash
# Install ngrok: https://ngrok.com/download
npm start

# In another terminal:
ngrok http 3000

# Share the generated URL (e.g., https://abc123.ngrok.app)
```

### 👁️ Spectating a Game

1. Get a **room code** from an ongoing game
2. Enter it in the **"Spectate Game"** section
3. Click **"Watch Game"**
4. You'll see the game board and can watch moves in real-time
5. Spectators cannot make moves

### 🎮 Chess Rules Refresher

- **♔ King**: Moves one square in any direction
- **♕ Queen**: Moves any number of squares horizontally, vertically, or diagonally
- **♖ Rook**: Moves any number of squares horizontally or vertically
- **♗ Bishop**: Moves any number of squares diagonally
- **♘ Knight**: Moves in an "L" shape (2 squares + 1 square perpendicular)
- **♙ Pawn**: Moves forward one square (two on first move), captures diagonally

**Special Moves:**
- **Castling**: Move king 2 squares toward rook, rook jumps over
- **En Passant**: Pawn captures pawn that just moved two squares
- **Pawn Promotion**: When pawn reaches opposite end, promote to Queen, Rook, Bishop, or Knight

---

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express
- Socket.io (real-time WebSocket communication)
- sql.js (in-memory SQLite database)
- bcrypt (password hashing)
- jsonwebtoken (authentication)

**Frontend:**
- Vanilla JavaScript (no framework!)
- HTML5 + CSS3
- Socket.io client

---

## 📁 Project Structure

```
online-chess/
├── server.js              # Main server with Socket.io
├── auth.js                # Authentication logic
├── database.js            # Database operations
├── package.json           # Dependencies
└── public/
    ├── index.html         # Main game page
    ├── login.html         # Login page
    ├── register.html      # Registration page
    ├── profile.html       # User profile page
    ├── style.css          # Styling
    ├── chess-game.js      # Game logic (rules, moves, validation)
    ├── chess-ui.js        # UI rendering and interaction
    ├── chess-ai.js        # AI opponent logic
    ├── chess-timer.js     # Chess clock implementation
    └── multiplayer-client.js  # Socket.io client + game modes
```

---

## 🚀 Deployment

### Deploy to Render (Free)

1. Create a **GitHub repository** and push your code
2. Go to [render.com](https://render.com) and sign up
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repo
5. Render will auto-detect the `render.yaml` file
6. Click **"Create Web Service"**
7. Wait for deployment (~2 minutes)
8. Share your URL!

### Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **"Start a New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway auto-detects Node.js
6. Get your deployment URL from the dashboard

---

## ⚠️ Known Issues

- Database is **in-memory** (resets on server restart) - user accounts are temporary
- For production use, migrate to PostgreSQL or MongoDB for persistent storage

---

## 🤝 Contributing

Feel free to fork, modify, and create pull requests! Some ideas for contributions:
- Persistent database integration
- Move validation improvements
- Additional AI difficulty levels
- Mobile UI improvements
- Sound effects

---

## 📝 License

MIT License - Free to use and modify!

---

## 🙏 Credits

Created with ❤️ using vanilla JavaScript and real-time WebSocket technology.

**Special thanks to:**
- Socket.io for real-time communication
- The chess community for game rules and notation standards
