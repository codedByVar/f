const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userOps } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Register new user
function register(username, password) {
    try {
        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        const result = userOps.create(username, passwordHash);
        if (result.success) {
            return { success: true, userId: result.lastID };
        } else {
            return { success: false, error: 'Username already exists' };
        }
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            return { success: false, error: 'Username already exists' };
        }
        return { success: false, error: error.message };
    }
}

// Login user
function login(username, password) {
    try {
        const user = userOps.findByUsername(username);

        if (!user) {
            return { success: false, error: 'Invalid username or password' };
        }

        const isValid = bcrypt.compareSync(password, user.password_hash);

        if (!isValid) {
            return { success: false, error: 'Invalid username or password' };
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws,
                rating: user.rating
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Verify token
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { success: true, userId: decoded.userId, username: decoded.username };
    } catch (error) {
        return { success: false, error: 'Invalid token' };
    }
}

module.exports = {
    register,
    login,
    verifyToken
};
