// Multiplayer Client
class MultiplayerClient {
    constructor(chessUI) {
        this.chessUI = chessUI;
        this.socket = null;
        this.roomCode = null;
        this.playerColor = null;
        this.connected = false;

        this.initializeSocket();
        this.setupUIControls();
    }

    initializeSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('room-created', ({ roomCode, color, timeControl }) => {
            console.log('Room created:', roomCode);
            this.roomCode = roomCode;
            this.playerColor = color;
            this.timeControl = timeControl;
            this.chessUI.setPlayerColor(color);
            this.showRoomInfo(roomCode, color, timeControl);
        });

        this.socket.on('room-joined', ({ roomCode, color, timeControl }) => {
            console.log('Joined room:', roomCode);
            this.roomCode = roomCode;
            this.playerColor = color;
            this.timeControl = timeControl;
            this.chessUI.setPlayerColor(color);
            this.showRoomInfo(roomCode, color, timeControl);
        });

        this.socket.on('opponent-joined', () => {
            console.log('Opponent joined');
            document.getElementById('waiting-message').classList.add('hidden');
        });

        this.socket.on('game-start', () => {
            console.log('Game starting');
            this.startGame();
        });

        this.socket.on('opponent-move', (move) => {
            console.log('Opponent move:', move);
            this.chessUI.handleOpponentMove(move);
        });

        this.socket.on('game-ended', ({ winner, reason }) => {
            console.log('Game ended:', winner, reason);
            let message = '';
            if (winner === 'draw') {
                message = `Game ended in a draw (${reason})`;
            } else {
                message = `${winner} wins by ${reason}!`;
            }
            this.chessUI.showGameOver(message);
        });

        this.socket.on('opponent-disconnected', ({ winner }) => {
            if (winner) {
                this.chessUI.showGameOver(`Opponent disconnected. You win by default!`);
                this.chessUI.updatePlayerStats('win');
            } else {
                alert('Opponent disconnected. Game over.');
                this.resetGame();
            }
        });

        this.socket.on('opponent-surrendered', () => {
            this.chessUI.showGameOver('Your opponent surrendered. You win!');
            this.chessUI.updatePlayerStats('win');
        });

        this.socket.on('spectator-joined', ({ roomCode, timeControl, playerColors }) => {
            console.log('Joined as spectator:', roomCode);
            this.roomCode = roomCode;
            this.timeControl = timeControl;
            this.isSpectator = true;
            this.startGame();
            alert('You are now watching this game');
        });

        this.socket.on('spectator-count', (count) => {
            const spectatorInfo = document.getElementById('spectator-info');
            if (spectatorInfo) {
                spectatorInfo.textContent = `👁️ ${count} watching`;
            }
        });

        this.socket.on('room-error', (error) => {
            alert(`Error: ${error}`);
        });
    }

    setupUIControls() {
        const createRoomBtn = document.getElementById('create-room-btn');
        const joinRoomBtn = document.getElementById('join-room-btn');
        const roomCodeInput = document.getElementById('room-code-input');
        const newGameBtn = document.getElementById('new-game-btn');

        createRoomBtn.addEventListener('click', () => {
            this.createRoom();
        });

        joinRoomBtn.addEventListener('click', () => {
            const code = roomCodeInput.value.trim().toUpperCase();
            if (code) {
                this.joinRoom(code);
            } else {
                alert('Please enter a room code');
            }
        });

        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoomBtn.click();
            }
        });

        newGameBtn.addEventListener('click', () => {
            this.resetGame();
        });

        // AI game button
        const playAIBtn = document.getElementById('play-ai-btn');
        if (playAIBtn) {
            playAIBtn.addEventListener('click', () => {
                this.startAIGame();
            });
        }

        // Spectate button
        const spectateBtn = document.getElementById('spectate-btn');
        const spectateCodeInput = document.getElementById('spectate-code-input');
        if (spectateBtn) {
            spectateBtn.addEventListener('click', () => {
                const code = spectateCodeInput.value.trim().toUpperCase();
                if (code) {
                    this.spectateRoom(code);
                } else {
                    alert('Please enter a room code to watch');
                }
            });
        }
    }

    startAIGame() {
        const difficulty = document.getElementById('ai-difficulty').value;
        const timeControl = document.getElementById('time-control').value;

        // Set up AI mode
        this.isAIMode = true;
        this.ai = new ChessAI(difficulty);
        this.playerColor = 'white'; // Player is always white in AI mode
        this.chessUI.setPlayerColor('white');

        // Hide room controls and show game
        document.getElementById('room-controls').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('player-stats').classList.remove('hidden');
        document.getElementById('game-controls').classList.remove('hidden');

        // Set up timer
        if (timeControl) {
            this.chessUI.initializeTimer(timeControl);
            this.chessUI.startTimer();
        }

        console.log(`AI game started: difficulty=${difficulty}, timeControl=${timeControl}`);
    }

    triggerAIMove() {
        if (!this.isAIMode || !this.ai) return;

        // Give a small delay to make it feel more natural
        setTimeout(() => {
            const move = this.ai.getBestMove(this.chessUI.game);
            if (move) {
                const { from, to } = move;
                this.chessUI.game.makeMove(from.row, from.col, to.row, to.col);
                this.chessUI.renderBoard();
                this.chessUI.addMoveToHistory(this.chessUI.game.moveHistory[this.chessUI.game.moveHistory.length - 1]);
                this.chessUI.switchTimerTurn();
                this.chessUI.isMyTurn = true;

                // Check game state
                const state = this.chessUI.game.getGameState();
                if (state.isCheckmate || state.isStalemate) {
                    const message = state.isCheckmate ?
                        `Checkmate! ${state.currentTurn === 'white' ? 'Black' : 'White'} wins!` :
                        'Stalemate! Game is a draw.';
                    this.chessUI.showGameOver(message);
                    this.chessUI.updatePlayerStats(state.isCheckmate ? 'loss' : 'draw');
                }
            }
        }, 500);
    }

    createRoom() {
        const timeControl = document.getElementById('time-control').value;
        this.socket.emit('create-room', { timeControl });
    }

    joinRoom(roomCode) {
        this.socket.emit('join-room', roomCode);
    }

    spectateRoom(roomCode) {
        this.socket.emit('spectate-room', roomCode);
    }

    sendMove(move) {
        if (this.roomCode) {
            this.socket.emit('make-move', {
                roomCode: this.roomCode,
                move
            });
        }
    }

    sendGameOver(winner, reason) {
        if (this.roomCode) {
            this.socket.emit('game-over', {
                roomCode: this.roomCode,
                winner,
                reason
            });
        }
    }

    sendSurrender() {
        if (this.roomCode) {
            this.socket.emit('surrender', {
                roomCode: this.roomCode
            });
        }
    }

    updateConnectionStatus(connected) {
        const statusBadge = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');

        if (connected) {
            statusBadge.classList.add('connected');
            statusText.textContent = 'Connected';
        } else {
            statusBadge.classList.remove('connected');
            statusText.textContent = 'Disconnected';
        }
    }

    showRoomInfo(roomCode, color, timeControl) {
        this.timeControl = timeControl;
        document.getElementById('room-controls').style.display = 'block';
        document.getElementById('current-room-code').textContent = roomCode;
        document.getElementById('player-color').textContent = color.charAt(0).toUpperCase() + color.slice(1);
        document.getElementById('room-info').classList.remove('hidden');
    }

    startGame() {
        document.getElementById('waiting-message').classList.add('hidden');
        document.getElementById('room-controls').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('player-stats').classList.remove('hidden');
        document.getElementById('game-controls').classList.remove('hidden');

        // Initialize and start timer
        if (this.timeControl) {
            this.chessUI.initializeTimer(this.timeControl);
            // White player starts the timer
            if (this.playerColor === 'white') {
                this.chessUI.startTimer();
            }
        }
    }

    resetGame() {
        // Reload the page to reset everything
        window.location.reload();
    }
}

// Auth management
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    if (token && username) {
        document.getElementById('guest-links').classList.add('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('welcome-text').textContent = `Welcome, ${username}!`;
    } else {
        document.getElementById('guest-links').classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
    }
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.reload();
});

document.getElementById('profile-btn')?.addEventListener('click', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        window.location.href = `profile.html?userId=${userId}`;
    }
});

// Initialize the game when page loads
let game, chessUI, multiplayerClient;

window.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

    game = new ChessGame();
    chessUI = new ChessUI(game);
    multiplayerClient = new MultiplayerClient(chessUI);

    // Make multiplayerClient globally accessible
    window.multiplayerClient = multiplayerClient;

    console.log('Chess game initialized');
});
