const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Import auth and database
const { register, login, verifyToken } = require('./auth');
const { userOps, gameOps } = require('./database');

// Auth endpoints
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  const result = register(username, password);
  res.json(result);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const result = login(username, password);
  res.json(result);
});

app.get('/api/profile/:userId', (req, res) => {
  const user = userOps.findById(req.params.userId);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.json({ success: false, error: 'User not found' });
  }
});

app.get('/api/games/:userId', (req, res) => {
  const games = gameOps.findByPlayerId(req.params.userId, 20);
  res.json({ success: true, games });
});

app.get('/api/game/:gameId', (req, res) => {
  const game = gameOps.findById(req.params.gameId);
  if (game) {
    res.json({ success: true, game });
  } else {
    res.json({ success: false, error: 'Game not found' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  const users = userOps.getLeaderboard(10);
  res.json({ success: true, users });
});

// Game rooms storage
const gameRooms = new Map();

// Helper function to generate room codes
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  // Create a new game room
  socket.on('create-room', ({ timeControl }) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      players: [socket.id],
      playerColors: { [socket.id]: 'white' },
      gameStarted: false,
      timeControl: timeControl || 'rapid'
    };
    gameRooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('room-created', { roomCode, color: 'white', timeControl: room.timeControl });
    console.log(`Room created: ${roomCode} with time control: ${room.timeControl}`);
  });

  // Join an existing game room
  socket.on('join-room', (roomCode) => {
    const room = gameRooms.get(roomCode);

    if (!room) {
      socket.emit('room-error', 'Room not found');
      return;
    }

    if (room.players.length >= 2) {
      socket.emit('room-error', 'Room is full');
      return;
    }

    if (room.gameStarted) {
      socket.emit('room-error', 'Game already in progress');
      return;
    }

    // Add player to room
    room.players.push(socket.id);
    room.playerColors[socket.id] = 'black';
    room.gameStarted = true;
    socket.join(roomCode);

    // Notify both players
    socket.emit('room-joined', { roomCode, color: 'black', timeControl: room.timeControl });
    io.to(room.players[0]).emit('opponent-joined');

    // Start the game
    io.to(roomCode).emit('game-start');
    console.log(`Player joined room: ${roomCode}`);
  });

  // Join as spectator
  socket.on('spectate-room', (roomCode) => {
    const room = gameRooms.get(roomCode);

    if (!room) {
      socket.emit('room-error', 'Room not found');
      return;
    }

    // Add to spectators list
    if (!room.spectators) {
      room.spectators = [];
    }
    room.spectators.push(socket.id);
    socket.join(roomCode);

    // Send current game state to spectator
    socket.emit('spectator-joined', {
      roomCode,
      timeControl: room.timeControl,
      playerColors: room.playerColors
    });

    // Notify all in room about spectator count
    io.to(roomCode).emit('spectator-count', room.spectators.length);
    console.log(`Spectator joined room: ${roomCode}`);
  });

  // Handle moves
  socket.on('make-move', ({ roomCode, move }) => {
    const room = gameRooms.get(roomCode);

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    // Broadcast move to the other player in the room
    socket.to(roomCode).emit('opponent-move', move);
  });

  // Handle game over
  socket.on('game-over', ({ roomCode, winner, reason }) => {
    io.to(roomCode).emit('game-ended', { winner, reason });
  });

  // Handle surrender
  socket.on('surrender', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);

    if (!room) {
      return;
    }

    // Notify opponent they won
    socket.to(roomCode).emit('opponent-surrendered');
    console.log(`Player surrendered in room: ${roomCode}`);

    // Clean up room
    gameRooms.delete(roomCode);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);

    // Find and clean up rooms
    for (const [roomCode, room] of gameRooms.entries()) {
      // Check if disconnected user is a player
      if (room.players.includes(socket.id)) {
        const gameWasActive = room.gameStarted && room.players.length === 2;

        if (gameWasActive) {
          socket.to(roomCode).emit('opponent-disconnected', { winner: true });
          console.log(`Player disconnected from active game in room ${roomCode}`);
        } else {
          socket.to(roomCode).emit('opponent-disconnected', { winner: false });
        }

        gameRooms.delete(roomCode);
      }
      // Check if disconnected user is a spectator
      else if (room.spectators && room.spectators.includes(socket.id)) {
        room.spectators = room.spectators.filter(id => id !== socket.id);
        io.to(roomCode).emit('spectator-count', room.spectators.length);
        console.log(`Spectator left room: ${roomCode}`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
