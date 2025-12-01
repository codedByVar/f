const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'chess.db');
let db;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables if they don't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 1200,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      white_player_id INTEGER,
      black_player_id INTEGER,
      winner TEXT,
      result TEXT,
      moves TEXT,
      pgn TEXT,
      time_control TEXT,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized');
}

// Save database to disk
function saveDatabase() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, data);
  }
}

// Auto-save every 10 seconds
setInterval(saveDatabase, 10000);

// Save on exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit();
});

// User operations
const userOps = {
  create(username, passwordHash) {
    try {
      db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, passwordHash]);
      saveDatabase();
      return { success: true, lastID: this.findByUsername(username).id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  findByUsername(username) {
    const results = db.exec('SELECT * FROM users WHERE username = ?', [username]);
    if (results.length > 0 && results[0].values.length > 0) {
      const row = results[0].values[0];
      return {
        id: row[0],
        username: row[1],
        password_hash: row[2],
        wins: row[3],
        losses: row[4],
        draws: row[5],
        rating: row[6],
        created_at: row[7]
      };
    }
    return null;
  },

  findById(userId) {
    const results = db.exec('SELECT id, username, wins, losses, draws, rating, created_at FROM users WHERE id = ?', [userId]);
    if (results.length > 0 && results[0].values.length > 0) {
      const row = results[0].values[0];
      return {
        id: row[0],
        username: row[1],
        wins: row[2],
        losses: row[3],
        draws: row[4],
        rating: row[5],
        created_at: row[6]
      };
    }
    return null;
  },

  updateStats(id, wins, losses, draws, rating) {
    db.run('UPDATE users SET wins = ?, losses = ?, draws, rating = ? WHERE id = ?',
      [wins, losses, draws, rating, id]);
    saveDatabase();
  },

  getLeaderboard(limit) {
    const results = db.exec('SELECT id, username, wins, losses, draws, rating FROM users ORDER BY rating DESC LIMIT ?', [limit]);
    if (results.length > 0) {
      return results[0].values.map(row => ({
        id: row[0],
        username: row[1],
        wins: row[2],
        losses: row[3],
        draws: row[4],
        rating: row[5]
      }));
    }
    return [];
  }
};

// Game operations
const gameOps = {
  create(whiteId, blackId, winner, result, moves, pgn, timeControl) {
    db.run('INSERT INTO games (white_player_id, black_player_id, winner, result, moves, pgn, time_control) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [whiteId, blackId, winner, result, moves, pgn, timeControl]);
    saveDatabase();
  },

  findByPlayerId(userId, limit) {
    const results = db.exec(`
      SELECT g.*, u1.username as white_username, u2.username as black_username
      FROM games g
      LEFT JOIN users u1 ON g.white_player_id = u1.id
      LEFT JOIN users u2 ON g.black_player_id = u2.id
      WHERE white_player_id = ? OR black_player_id = ?
      ORDER BY played_at DESC LIMIT ?
    `, [userId, userId, limit]);

    if (results.length > 0) {
      return results[0].values.map(row => ({
        id: row[0],
        white_player_id: row[1],
        black_player_id: row[2],
        winner: row[3],
        result: row[4],
        moves: row[5],
        pgn: row[6],
        time_control: row[7],
        played_at: row[8],
        white_username: row[9],
        black_username: row[10]
      }));
    }
    return [];
  },

  findById(gameId) {
    const results = db.exec(`
      SELECT g.*, u1.username as white_username, u2.username as black_username
      FROM games g
      LEFT JOIN users u1 ON g.white_player_id = u1.id
      LEFT JOIN users u2 ON g.black_player_id = u2.id
      WHERE g.id = ?
    `, [gameId]);

    if (results.length > 0 && results[0].values.length > 0) {
      const row = results[0].values[0];
      return {
        id: row[0],
        white_player_id: row[1],
        black_player_id: row[2],
        winner: row[3],
        result: row[4],
        moves: row[5],
        pgn: row[6],
        time_control: row[7],
        played_at: row[8],
        white_username: row[9],
        black_username: row[10]
      };
    }
    return null;
  }
};

module.exports = {
  initDatabase,
  db,
  userOps,
  gameOps
};
