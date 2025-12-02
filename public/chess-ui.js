// Chess UI Controller
class ChessUI {
    constructor(game) {
        this.game = game;
        this.boardElement = document.getElementById('chess-board');
        this.selectedSquare = null;
        this.validMoves = [];
        this.playerColor = null;
        this.isMyTurn = false;
        this.pendingPromotion = null;

        this.pieceUnicode = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };

        this.timer = null;
        this.timeControl = null;

        this.initializeBoard();
        this.setupEventListeners();
    }

    initializeBoard() {
        this.boardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                this.boardElement.appendChild(square);
            }
        }

        this.renderBoard();
    }

    renderBoard() {
        const squares = this.boardElement.querySelectorAll('.square');

        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.game.getPiece(row, col);

            square.innerHTML = '';
            square.classList.remove('selected', 'valid-move', 'has-piece');

            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = this.pieceUnicode[piece.color][piece.type];
                pieceElement.dataset.row = row;
                pieceElement.dataset.col = col;
                square.appendChild(pieceElement);
            }
        });

        this.updateGameStatus();
        this.updateCapturedPieces();
    }

    setupEventListeners() {
        this.boardElement.addEventListener('click', (e) => {
            if (!this.isMyTurn) return;

            const square = e.target.closest('.square');
            if (!square) return;

            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);

            this.handleSquareClick(row, col);
        });

        // Promotion dialog
        document.querySelectorAll('.promotion-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pieceType = e.target.dataset.piece;
                this.handlePromotion(pieceType);
            });
        });

        // Surrender button
        const surrenderBtn = document.getElementById('surrender-btn');
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => {
                this.handleSurrender();
            });
        }

        // Load player stats
        this.loadPlayerStats();
    }

    handleSurrender() {
        if (confirm('Are you sure you want to surrender?')) {
            const winner = this.playerColor === 'white' ? 'Black' : 'White';
            this.showGameOver(`You surrendered. ${winner} wins!`);
            if (window.multiplayerClient) {
                window.multiplayerClient.sendSurrender();
            }
            this.updatePlayerStats('loss');
        }
    }

    loadPlayerStats() {
        const stats = JSON.parse(localStorage.getItem('chessStats') || '{"wins":0,"losses":0,"draws":0}');
        document.getElementById('stat-wins').textContent = stats.wins;
        document.getElementById('stat-losses').textContent = stats.losses;
        document.getElementById('stat-draws').textContent = stats.draws;
    }

    updatePlayerStats(result) {
        const stats = JSON.parse(localStorage.getItem('chessStats') || '{"wins":0,"losses":0,"draws":0}');
        if (result === 'win') stats.wins++;
        else if (result === 'loss') stats.losses++;
        else if (result === 'draw') stats.draws++;

        localStorage.setItem('chessStats', JSON.stringify(stats));
        this.loadPlayerStats();
    }

    handleSquareClick(row, col) {
        // Prevent moves in spectator mode
        if (window.multiplayerClient && window.multiplayerClient.isSpectator) {
            return;
        }

        if (!this.isMyTurn) return;

        const piece = this.game.getPiece(row, col);

        // If a square is already selected
        if (this.selectedSquare) {
            const { row: fromRow, col: fromCol } = this.selectedSquare;

            // Check if clicked square is a valid move
            const isValidMove = this.validMoves.some(
                move => move.row === row && move.col === col
            );

            if (isValidMove) {
                this.attemptMove(fromRow, fromCol, row, col);
            } else if (piece && piece.color === this.game.currentTurn) {
                // Select different piece
                this.selectSquare(row, col);
            } else {
                // Deselect
                this.deselectSquare();
            }
        } else {
            // Select a piece
            if (piece && piece.color === this.game.currentTurn) {
                this.selectSquare(row, col);
            }
        }
    }

    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.validMoves = this.game.getValidMoves(row, col);

        // Highlight selected square
        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(sq => sq.classList.remove('selected', 'valid-move', 'has-piece'));

        const selectedElement = this.getSquareElement(row, col);
        selectedElement.classList.add('selected');

        // Highlight valid moves
        this.validMoves.forEach(move => {
            const element = this.getSquareElement(move.row, move.col);
            element.classList.add('valid-move');

            const hasPiece = this.game.getPiece(move.row, move.col);
            if (hasPiece) {
                element.classList.add('has-piece');
            }
        });
    }

    deselectSquare() {
        this.selectedSquare = null;
        this.validMoves = [];

        const squares = this.boardElement.querySelectorAll('.square');
        squares.forEach(sq => sq.classList.remove('selected', 'valid-move', 'has-piece'));
    }

    attemptMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.game.getPiece(fromRow, fromCol);

        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.pendingPromotion = { fromRow, fromCol, toRow, toCol };
            this.showPromotionDialog(piece.color);
            return;
        }

        this.executeMove(fromRow, fromCol, toRow, toCol);
    }

    executeMove(fromRow, fromCol, toRow, toCol, promotionPiece = 'queen') {
        const success = this.game.makeMove(fromRow, fromCol, toRow, toCol, promotionPiece);

        if (success) {
            this.deselectSquare();
            this.renderBoard();

            // Add move to history ONCE here
            this.addMoveToHistory(this.game.moveHistory[this.game.moveHistory.length - 1]);

            // Check game state
            const state = this.game.getGameState();
            if (state.isCheckmate) {
                const winner = this.game.currentTurn === 'white' ? 'Black' : 'White';
                this.showGameOver(`Checkmate! ${winner} wins!`);
                if (window.multiplayerClient) {
                    window.multiplayerClient.sendGameOver(winner, 'checkmate');
                }
            } else if (state.isStalemate) {
                this.showGameOver('Stalemate! Game is a draw.');
                if (window.multiplayerClient) {
                    window.multiplayerClient.sendGameOver('draw', 'stalemate');
                }
            }

            // Notify multiplayer
            if (window.multiplayerClient) {
                window.multiplayerClient.sendMove({
                    fromRow,
                    fromCol,
                    toRow,
                    toCol,
                    promotionPiece
                });
            }

            // Switch timer turn
            this.switchTimerTurn();

            this.isMyTurn = false;

            // Trigger AI move if in AI mode
            if (window.multiplayerClient && window.multiplayerClient.isAIMode) {
                window.multiplayerClient.triggerAIMove();
            }
        }
    }

    showPromotionDialog(color) {
        const dialog = document.getElementById('promotion-dialog');
        dialog.classList.remove('hidden');

        // Update piece colors in dialog
        const choices = dialog.querySelectorAll('.promotion-choice');
        choices.forEach(choice => {
            const pieceType = choice.dataset.piece;
            choice.textContent = this.pieceUnicode[color][pieceType];
        });
    }

    handlePromotion(pieceType) {
        const dialog = document.getElementById('promotion-dialog');
        dialog.classList.add('hidden');

        if (this.pendingPromotion) {
            const { fromRow, fromCol, toRow, toCol } = this.pendingPromotion;
            this.executeMove(fromRow, fromCol, toRow, toCol, pieceType);
            this.pendingPromotion = null;
        }
    }

    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    updateGameStatus() {
        const turnText = document.getElementById('turn-text');
        const checkIndicator = document.getElementById('check-indicator');

        const state = this.game.getGameState();
        turnText.textContent = `${state.currentTurn.charAt(0).toUpperCase() + state.currentTurn.slice(1)}'s Turn`;

        if (state.isCheck) {
            checkIndicator.classList.remove('hidden');
        } else {
            checkIndicator.classList.add('hidden');
        }

        // Update turn indicator for current player
        if (this.playerColor) {
            this.isMyTurn = (this.game.currentTurn === this.playerColor);

            if (this.isMyTurn) {
                turnText.style.color = 'var(--accent-gold)';
                turnText.textContent = 'Your Turn';
            } else {
                turnText.style.color = 'var(--text-primary)';
                turnText.textContent = "Opponent's Turn";
            }
        }
    }

    updateCapturedPieces() {
        const whiteCaptured = document.getElementById('white-captured');
        const blackCaptured = document.getElementById('black-captured');

        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';

        this.game.capturedPieces.white.forEach(pieceType => {
            const piece = document.createElement('span');
            piece.className = 'captured-piece';
            piece.textContent = this.pieceUnicode.white[pieceType];
            whiteCaptured.appendChild(piece);
        });

        this.game.capturedPieces.black.forEach(pieceType => {
            const piece = document.createElement('span');
            piece.className = 'captured-piece';
            piece.textContent = this.pieceUnicode.black[pieceType];
            blackCaptured.appendChild(piece);
        });
    }

    addMoveToHistory(moveNotation) {
        const moveList = document.getElementById('move-list');
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.textContent = `${this.game.fullMoveNumber}. ${moveNotation}`;
        moveList.appendChild(moveItem);

        // Scroll to bottom
        moveList.scrollTop = moveList.scrollHeight;
    }

    showGameOver(message) {
        const dialog = document.getElementById('game-over-dialog');
        const messageElement = document.getElementById('game-over-message');

        messageElement.textContent = message;
        dialog.classList.remove('hidden');
    }

    setPlayerColor(color) {
        this.playerColor = color;
        this.isMyTurn = (color === 'white');

        // Flip board for black player
        if (color === 'black') {
            this.boardElement.style.transform = 'rotate(180deg)';
            this.boardElement.querySelectorAll('.piece').forEach(piece => {
                piece.style.transform = 'rotate(180deg)';
            });
        }

        this.updateGameStatus();
    }

    handleOpponentMove(move) {
        const { fromRow, fromCol, toRow, toCol, promotionPiece } = move;
        const success = this.game.makeMove(fromRow, fromCol, toRow, toCol, promotionPiece || 'queen');

        if (success) {
            this.renderBoard();
            // Add move to history ONCE here
            this.addMoveToHistory(this.game.moveHistory[this.game.moveHistory.length - 1]);
            this.isMyTurn = true;

            // Check game state
            const state = this.game.getGameState();
            if (state.isCheckmate || state.isStalemate) {
                const message = state.isCheckmate ?
                    `Checkmate! ${state.currentTurn === 'white' ? 'Black' : 'White'} wins!` :
                    'Stalemate! Game is a draw.';
                this.showGameOver(message);
            }
        }
    }

    // Timer methods
    initializeTimer(timeControl) {
        if (!window.TIME_CONTROLS) return;

        this.timeControl = window.TIME_CONTROLS[timeControl];
        const { time, increment } = this.timeControl;

        this.timer = new ChessTimer(time, increment);

        // Set up timer callbacks
        this.timer.setOnUpdate((whiteTime, blackTime) => {
            this.updateTimerDisplay(whiteTime, blackTime);
        });

        this.timer.setOnTimeout((color) => {
            this.handleTimeout(color);
        });

        document.getElementById('timer-container').classList.remove('hidden');
        this.updateTimerDisplay(time, time);
    }

    updateTimerDisplay(whiteTime, blackTime) {
        const whiteDisplay = document.getElementById('timer-white');
        const blackDisplay = document.getElementById('timer-black');
        const whiteTimer = document.querySelector('.timer-white');
        const blackTimer = document.querySelector('.timer-black');

        if (whiteDisplay) whiteDisplay.textContent = this.timer.formatTime(whiteTime);
        if (blackDisplay) blackDisplay.textContent = this.timer.formatTime(blackTime);

        // Add low-time warning
        if (whiteTime < 30) {
            whiteTimer.classList.add('low-time');
        } else {
            whiteTimer.classList.remove('low-time');
        }

        if (blackTime < 30) {
            blackTimer.classList.add('low-time');
        } else {
            blackTimer.classList.remove('low-time');
        }

        // Update active timer visual
        if (this.timer.activeColor === 'white') {
            whiteTimer.classList.add('active');
            blackTimer.classList.remove('active');
        } else if (this.timer.activeColor === 'black') {
            blackTimer.classList.add('active');
            whiteTimer.classList.remove('active');
        }
    }

    startTimer() {
        if (this.timer) {
            this.timer.start('white'); // White always starts
        }
    }

    switchTimerTurn() {
        if (this.timer) {
            this.timer.switchTurn();
        }
    }

    handleTimeout(color) {
        const winner = color === 'white' ? 'Black' : 'White';
        this.showGameOver(`Time's up! ${winner} wins by timeout!`);
        this.updatePlayerStats(color === this.playerColor ? 'loss' : 'win');
        if (window.multiplayerClient) {
            window.multiplayerClient.sendGameOver(winner, 'timeout');
        }
    }
}
