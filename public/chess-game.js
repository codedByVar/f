// Chess Game Logic
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentTurn = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.enPassantTarget = null;
        this.castlingRights = {
            white: { kingside: true, queenside: true },
            black: { kingside: true, queenside: true }
        };
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
    }

    initializeBoard() {
        // Initialize 8x8 board with starting position
        const board = Array(8).fill(null).map(() => Array(8).fill(null));

        // Pawns
        for (let i = 0; i < 8; i++) {
            board[1][i] = { type: 'pawn', color: 'black' };
            board[6][i] = { type: 'pawn', color: 'white' };
        }

        // Black pieces
        board[0][0] = { type: 'rook', color: 'black' };
        board[0][1] = { type: 'knight', color: 'black' };
        board[0][2] = { type: 'bishop', color: 'black' };
        board[0][3] = { type: 'queen', color: 'black' };
        board[0][4] = { type: 'king', color: 'black' };
        board[0][5] = { type: 'bishop', color: 'black' };
        board[0][6] = { type: 'knight', color: 'black' };
        board[0][7] = { type: 'rook', color: 'black' };

        // White pieces
        board[7][0] = { type: 'rook', color: 'white' };
        board[7][1] = { type: 'knight', color: 'white' };
        board[7][2] = { type: 'bishop', color: 'white' };
        board[7][3] = { type: 'queen', color: 'white' };
        board[7][4] = { type: 'king', color: 'white' };
        board[7][5] = { type: 'bishop', color: 'white' };
        board[7][6] = { type: 'knight', color: 'white' };
        board[7][7] = { type: 'rook', color: 'white' };

        return board;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col];
    }

    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentTurn) return [];

        let moves = [];

        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(row, col, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(row, col, piece.color);
                break;
            case 'knight':
                moves = this.getKnightMoves(row, col, piece.color);
                break;
            case 'bishop':
                moves = this.getBishopMoves(row, col, piece.color);
                break;
            case 'queen':
                moves = this.getQueenMoves(row, col, piece.color);
                break;
            case 'king':
                moves = this.getKingMoves(row, col, piece.color);
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => {
            return !this.wouldBeInCheck(row, col, move.row, move.col, piece.color);
        });
    }

    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        // Forward move
        if (!this.getPiece(row + direction, col)) {
            moves.push({ row: row + direction, col });

            // Double move from start
            if (row === startRow && !this.getPiece(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col });
            }
        }

        // Captures
        for (const dcol of [-1, 1]) {
            const target = this.getPiece(row + direction, col + dcol);
            if (target && target.color !== color) {
                moves.push({ row: row + direction, col: col + dcol });
            }
        }

        // En passant
        if (this.enPassantTarget) {
            if (this.enPassantTarget.row === row + direction &&
                Math.abs(this.enPassantTarget.col - col) === 1) {
                moves.push({ row: this.enPassantTarget.row, col: this.enPassantTarget.col });
            }
        }

        return moves;
    }

    getRookMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getBishopMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getQueenMoves(row, col, color) {
        return this.getSlidingMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getSlidingMoves(row, col, color, directions) {
        const moves = [];

        for (const [drow, dcol] of directions) {
            let newRow = row + drow;
            let newCol = col + dcol;

            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = this.getPiece(newRow, newCol);

                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }

                newRow += drow;
                newCol += dcol;
            }
        }

        return moves;
    }

    getKnightMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [drow, dcol] of offsets) {
            const newRow = row + drow;
            const newCol = col + dcol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [drow, dcol] of offsets) {
            const newRow = row + drow;
            const newCol = col + dcol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = this.getPiece(newRow, newCol);
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // Castling
        if (!this.isInCheck(color)) {
            const castlingRow = color === 'white' ? 7 : 0;

            // Kingside
            if (this.castlingRights[color].kingside) {
                if (!this.getPiece(castlingRow, 5) &&
                    !this.getPiece(castlingRow, 6) &&
                    !this.isSquareAttacked(castlingRow, 5, color) &&
                    !this.isSquareAttacked(castlingRow, 6, color)) {
                    moves.push({ row: castlingRow, col: 6 });
                }
            }

            // Queenside
            if (this.castlingRights[color].queenside) {
                if (!this.getPiece(castlingRow, 3) &&
                    !this.getPiece(castlingRow, 2) &&
                    !this.getPiece(castlingRow, 1) &&
                    !this.isSquareAttacked(castlingRow, 3, color) &&
                    !this.isSquareAttacked(castlingRow, 2, color)) {
                    moves.push({ row: castlingRow, col: 2 });
                }
            }
        }

        return moves;
    }

    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Simulate the move
        const piece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);

        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        const inCheck = this.isInCheck(color);

        // Undo the move
        this.setPiece(fromRow, fromCol, piece);
        this.setPiece(toRow, toCol, capturedPiece);

        return inCheck;
    }

    isInCheck(color) {
        // Find king position
        let kingPos = null;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === 'king' && piece.color === color) {
                    kingPos = { row, col };
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return false;

        return this.isSquareAttacked(kingPos.row, kingPos.col, color);
    }

    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';

        // Check all opponent pieces
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = this.getPiece(r, c);
                if (piece && piece.color === attackingColor) {
                    const moves = this.getRawMoves(r, c, piece);
                    if (moves.some(move => move.row === row && move.col === col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getRawMoves(row, col, piece) {
        // Get moves without check validation (to prevent infinite recursion)
        switch (piece.type) {
            case 'pawn':
                return this.getRawPawnMoves(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                return this.getRawKingMoves(row, col, piece.color);
            default:
                return [];
        }
    }

    getRawPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;

        // Captures only (for attack detection)
        for (const dcol of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + dcol;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    getRawKingMoves(row, col, color) {
        const moves = [];
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [drow, dcol] of offsets) {
            const newRow = row + drow;
            const newCol = col + dcol;

            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = 'queen') {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        const validMoves = this.getValidMoves(fromRow, fromCol);
        const isValid = validMoves.some(move => move.row === toRow && move.col === toCol);

        if (!isValid) return false;

        const capturedPiece = this.getPiece(toRow, toCol);

        // Handle en passant capture
        if (piece.type === 'pawn' && this.enPassantTarget &&
            toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
            const captureRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            const captured = this.getPiece(captureRow, toCol);
            this.capturedPieces[captured.color].push(captured.type);
            this.setPiece(captureRow, toCol, null);
        } else if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece.type);
        }

        // Handle castling
        if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const rookCol = toCol > fromCol ? 7 : 0;
            const newRookCol = toCol > fromCol ? 5 : 3;
            const rook = this.getPiece(fromRow, rookCol);
            this.setPiece(fromRow, newRookCol, rook);
            this.setPiece(fromRow, rookCol, null);
        }

        // Move piece
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);

        // Handle pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            this.setPiece(toRow, toCol, { type: promotionPiece, color: piece.color });
        }

        // Update en passant target
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2,
                col: toCol
            };
        } else {
            this.enPassantTarget = null;
        }

        // Update castling rights
        if (piece.type === 'king') {
            this.castlingRights[piece.color].kingside = false;
            this.castlingRights[piece.color].queenside = false;
        }
        if (piece.type === 'rook') {
            if (fromCol === 0) this.castlingRights[piece.color].queenside = false;
            if (fromCol === 7) this.castlingRights[piece.color].kingside = false;
        }

        // Record move with move number and color
        const moveNotation = this.getMoveNotation(fromRow, fromCol, toRow, toCol, piece);
        this.moveHistory.push({
            notation: moveNotation,
            moveNumber: this.fullMoveNumber,
            color: this.currentTurn
        });

        // Switch turn
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

        if (this.currentTurn === 'white') {
            this.fullMoveNumber++;
        }

        return true;
    }

    getMoveNotation(fromRow, fromCol, toRow, toCol, piece) {
        const files = 'abcdefgh';
        const from = files[fromCol] + (8 - fromRow);
        const to = files[toCol] + (8 - toRow);
        const symbol = this.getPieceSymbol(piece.type);
        return `${symbol}${from}-${to}`;
    }

    getPieceSymbol(type) {
        const symbols = {
            king: 'K',
            queen: 'Q',
            rook: 'R',
            bishop: 'B',
            knight: 'N',
            pawn: ''
        };
        return symbols[type] || '';
    }

    isCheckmate() {
        if (!this.isInCheck(this.currentTurn)) return false;
        return this.hasNoLegalMoves();
    }

    isStalemate() {
        if (this.isInCheck(this.currentTurn)) return false;
        return this.hasNoLegalMoves();
    }

    hasNoLegalMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === this.currentTurn) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) return false;
                }
            }
        }
        return true;
    }

    getGameState() {
        return {
            board: this.board,
            currentTurn: this.currentTurn,
            isCheck: this.isInCheck(this.currentTurn),
            isCheckmate: this.isCheckmate(),
            isStalemate: this.isStalemate(),
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces
        };
    }

    clone() {
        const newGame = new ChessGame();

        // Deep copy board
        newGame.board = this.board.map(row => row.map(piece => piece ? { ...piece } : null));

        // Copy primitives
        newGame.currentTurn = this.currentTurn;
        newGame.selectedSquare = null;
        newGame.halfMoveClock = this.halfMoveClock;
        newGame.fullMoveNumber = this.fullMoveNumber;

        // Deep copy objects
        newGame.moveHistory = JSON.parse(JSON.stringify(this.moveHistory));
        newGame.capturedPieces = JSON.parse(JSON.stringify(this.capturedPieces));
        newGame.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
        newGame.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;

        return newGame;
    }
}
