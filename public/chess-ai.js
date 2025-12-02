// Chess AI using Minimax Algorithm
class ChessAI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.depths = {
            easy: 2,
            medium: 3,
            hard: 4
        };
        this.maxDepth = this.depths[difficulty] || 3;

        // Piece values
        this.pieceValues = {
            pawn: 100,
            knight: 320,
            bishop: 330,
            rook: 500,
            queen: 900,
            king: 20000
        };

        // Position bonus tables
        this.pawnTable = [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5, 5, 10, 25, 25, 10, 5, 5],
            [0, 0, 0, 20, 20, 0, 0, 0],
            [5, -5, -10, 0, 0, -10, -5, 5],
            [5, 10, 10, -20, -20, 10, 10, 5],
            [0, 0, 0, 0, 0, 0, 0, 0]
        ];

        this.knightTable = [
            [-50, -40, -30, -30, -30, -30, -40, -50],
            [-40, -20, 0, 0, 0, 0, -20, -40],
            [-30, 0, 10, 15, 15, 10, 0, -30],
            [-30, 5, 15, 20, 20, 15, 5, -30],
            [-30, 0, 15, 20, 20, 15, 0, -30],
            [-30, 5, 10, 15, 15, 10, 5, -30],
            [-40, -20, 0, 5, 5, 0, -20, -40],
            [-50, -40, -30, -30, -30, -30, -40, -50]
        ];
    }

    // Find best move for AI
    getBestMove(game) {
        let bestScore = -Infinity;
        let bestMove = null;
        const moves = this.getAllPossibleMoves(game, game.currentTurn);

        // Shuffle moves for variety at same depth
        this.shuffleArray(moves);

        for (const move of moves) {
            const { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } } = move;

            // Try the move
            const piece = game.getPiece(fromRow, fromCol);
            const captured = game.getPiece(toRow, toCol);
            const tempEnPassant = game.enPassantTarget;
            const tempCastling = JSON.parse(JSON.stringify(game.castlingRights));

            game.makeMove(fromRow, fromCol, toRow, toCol);

            // Evaluate position
            const score = -this.minimax(game, this.maxDepth - 1, -Infinity, Infinity, false);

            // Undo move
            this.undoMove(game, fromRow, fromCol, toRow, toCol, piece, captured, tempEnPassant, tempCastling);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // Minimax algorithm with alpha-beta pruning
    minimax(game, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || game.isCheckmate() || game.isStalemate()) {
            return this.evaluatePosition(game);
        }

        const color = game.currentTurn;
        const moves = this.getAllPossibleMoves(game, color);

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } } = move;

                const piece = game.getPiece(fromRow, fromCol);
                const captured = game.getPiece(toRow, toCol);
                const tempEnPassant = game.enPassantTarget;
                const tempCastling = JSON.parse(JSON.stringify(game.castlingRights));

                game.makeMove(fromRow, fromCol, toRow, toCol);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, false);
                this.undoMove(game, fromRow, fromCol, toRow, toCol, piece, captured, tempEnPassant, tempCastling);

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const { from: { row: fromRow, col: fromCol }, to: { row: toRow, col: toCol } } = move;

                const piece = game.getPiece(fromRow, fromCol);
                const captured = game.getPiece(toRow, toCol);
                const tempEnPassant = game.enPassantTarget;
                const tempCastling = JSON.parse(JSON.stringify(game.castlingRights));

                game.makeMove(fromRow, fromCol, toRow, toCol);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, true);
                this.undoMove(game, fromRow, fromCol, toRow, toCol, piece, captured, tempEnPassant, tempCastling);

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            return minEval;
        }
    }

    // Evaluate board position
    evaluatePosition(game) {
        if (game.isCheckmate()) {
            return game.currentTurn === game.currentTurn ? -100000 : 100000;
        }
        if (game.isStalemate()) {
            return 0;
        }

        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (!piece) continue;

                let pieceValue = this.pieceValues[piece.type];

                // Add position bonus
                if (piece.type === 'pawn') {
                    pieceValue += piece.color === 'white' ?
                        this.pawnTable[row][col] :
                        this.pawnTable[7 - row][col];
                } else if (piece.type === 'knight') {
                    pieceValue += piece.color === 'white' ?
                        this.knightTable[row][col] :
                        this.knightTable[7 - row][col];
                }

                if (piece.color === 'white') {
                    score += pieceValue;
                } else {
                    score -= pieceValue;
                }
            }
        }

        return game.currentTurn === 'white' ? score : -score;
    }

    // Get all possible moves for a color
    getAllPossibleMoves(game, color) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPiece(row, col);
                if (piece && piece.color === color) {
                    const validMoves = game.getValidMoves(row, col);
                    for (const move of validMoves) {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col }
                        });
                    }
                }
            }
        }

        return moves;
    }

    // Undo a move (simple version for AI purposes)
    undoMove(game, fromRow, fromCol, toRow, toCol, piece, capturedPiece, tempEnPassant, tempCastling) {
        // Restore piece to original position
        game.setPiece(fromRow, fromCol, piece);
        game.setPiece(toRow, toCol, capturedPiece);

        // Restore game state
        game.enPassantTarget = tempEnPassant;
        game.castlingRights = tempCastling;

        // Revert fullMoveNumber if we are reverting from White's turn (meaning Black just moved)
        if (game.currentTurn === 'white') {
            game.fullMoveNumber--;
        }

        game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';

        // Remove last move from history (if it was added)
        if (game.moveHistory.length > 0) {
            game.moveHistory.pop();
        }

        // Remove captured piece from capturedPieces list
        if (capturedPiece) {
            game.capturedPieces[capturedPiece.color].pop();
        } else {
            // Handle En Passant capture removal
            // If it was an en passant move, the captured piece wasn't at toRow, toCol
            // We can infer it was en passant if we moved a pawn diagonally to an empty square
            if (piece.type === 'pawn' && Math.abs(fromCol - toCol) === 1 && !capturedPiece) {
                // It was likely en passant (or just a move, but we only care if it captured)
                // Wait, if !capturedPiece, it could be a normal move to empty square.
                // But En Passant is the ONLY way a pawn moves diagonally to empty square.
                const capturedColor = piece.color === 'white' ? 'black' : 'white';
                // Check if we actually added a captured piece for this?
                // makeMove adds it. So we should remove it.
                // But we need to be sure it was En Passant.
                // We can check if the move we just undid was En Passant.
                // The tempEnPassant (previous state) might tell us if there was a target.
                // If toRow, toCol matches tempEnPassant, it was En Passant.
                if (tempEnPassant && toRow === tempEnPassant.row && toCol === tempEnPassant.col) {
                     game.capturedPieces[capturedColor].pop();
                     // Also restore the captured pawn on the board!
                     // The captured pawn was at [fromRow, toCol] (for white) or [fromRow, toCol] ?
                     // No, captureRow is toRow + 1 (if white moved up to toRow) -> captured was below.
                     // White moves from 6 to 5. Capture row is 5+1 = 6? No.
                     // White pawn at row 3. Moves to row 2. En Passant target at row 2.
                     // Captured pawn was at row 3.
                     // So captureRow = fromRow.
                     const captureRow = fromRow;
                     // Wait, makeMove logic:
                     // const captureRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
                     // If white moves from 4 to 3 (indices). toRow=3. captureRow=4.
                     // fromRow was 4. So yes, captureRow == fromRow.
                     // We need to put the captured pawn back!
                     // capturedPiece argument is null. So we need to create it.
                     game.setPiece(captureRow, toCol, { type: 'pawn', color: capturedColor });
                }
            }
        }
    }

    // Shuffle array for move randomization
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.maxDepth = this.depths[difficulty] || 3;
    }
}
