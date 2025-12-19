/*===========================AI MODULE=======================*/

import { generateAllLegalMoves, getRowIndex } from "./game.js";

/*===========================AI CONFIGURATION=======================*/

const DIFFICULTY_DEPTHS = {
  easy: 2,
  medium: 4,
  hard: 6,
  expert: 8,
};

const PIECE_VALUES = {
  regular: 3,
  king: 5,
};

/*===========================EVALUATION FUNCTION=======================*/

/**
 * Evaluate the board position from the perspective of the given player
 * Higher scores are better for the player
 */
function evaluatePosition(state, player) {
  let score = 0;

  // Material count and position bonuses
  state.boardValues.forEach((cellValue, cellIndex) => {
    if (!cellValue) return;

    const [piecePlayer, pieceType] = cellValue.split("_");
    const isKing = pieceType === "King";
    const pieceValue = isKing ? PIECE_VALUES.king : PIECE_VALUES.regular;

    // Base material value
    const materialScore = piecePlayer === player ? pieceValue : -pieceValue;
    score += materialScore;

    // Position bonuses (encourage advancement)
    const rowIndex = getRowIndex(cellIndex);
    const colIndex = cellIndex % 8;

    if (piecePlayer === player && !isKing) {
      // Reward pieces that advance toward opponent's side
      const advancement = player === "White" ? rowIndex : 7 - rowIndex;
      score += advancement * 0.1;

      // Center control bonus (columns 3 and 4 are more valuable)
      if (colIndex >= 3 && colIndex <= 4) {
        score += 0.3;
      }
    } else if (piecePlayer !== player && !isKing) {
      // Penalize opponent's advancement
      const advancement = player === "White" ? 7 - rowIndex : rowIndex;
      score -= advancement * 0.1;

      // Penalize opponent's center control
      if (colIndex >= 3 && colIndex <= 4) {
        score -= 0.3;
      }
    }
  });

  return score;
}

/*===========================STATE MANAGEMENT=======================*/

/**
 * Apply a complete move to the state (clones state, applies move, updates game state)
 * This is different from game.js applyMove which only applies the move without switching turns
 */
function applyMoveComplete(state, move) {
  const newState = structuredClone(state);
  const startPos = move.path[0];
  const endPos = move.path[move.path.length - 1];

  // Move the piece
  const [player, pieceType] = newState.boardValues[startPos].split("_");
  newState.boardValues[endPos] = newState.boardValues[startPos];
  newState.boardValues[startPos] = "";

  // Remove captured pieces
  move.captures.forEach((captureIdx) => {
    newState.boardValues[captureIdx] = "";
  });

  // Crown piece if it reached the last row
  const rowIndex = getRowIndex(endPos);
  const shouldCrown =
    (player === "White" && rowIndex === 7) ||
    (player === "Black" && rowIndex === 0);

  if (shouldCrown && pieceType === "Regular") {
    newState.boardValues[endPos] = `${player}_King`;
  }

  // Switch turn
  newState.turn = newState.turn === newState.players[0] ? newState.players[1] : newState.players[0];

  // Update legal moves for new state
  newState.legalMoves = generateAllLegalMoves(newState);

  // Check for winner
  const boardString = newState.boardValues.join(" ");
  if (!boardString.includes(newState.players[0])) {
    newState.winner = newState.players[1];
  } else if (!boardString.includes(newState.players[1])) {
    newState.winner = newState.players[0];
  }

  return newState;
}

/*===========================MINIMAX ALGORITHM=======================*/

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(state, depth, alpha, beta, maximizingPlayer, aiPlayer) {
  // Terminal conditions
  if (depth === 0 || state.winner || state.legalMoves.length === 0) {
    return {
      score: evaluatePosition(state, aiPlayer),
      move: null,
    };
  }

  // Get all legal moves and order them (captures first for better pruning)
  const moves = state.legalMoves.slice();
  moves.sort((a, b) => b.captures.length - a.captures.length);

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove = null;

    for (const move of moves) {
      const newState = applyMoveComplete(state, move);
      const evaluation = minimax(
        newState,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer
      );

      if (evaluation.score > maxEval) {
        maxEval = evaluation.score;
        bestMove = move;
      }

      alpha = Math.max(alpha, evaluation.score);
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }

    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    let bestMove = null;

    for (const move of moves) {
      const newState = applyMoveComplete(state, move);
      const evaluation = minimax(
        newState,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer
      );

      if (evaluation.score < minEval) {
        minEval = evaluation.score;
        bestMove = move;
      }

      beta = Math.min(beta, evaluation.score);
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    return { score: minEval, move: bestMove };
  }
}

/*===========================PUBLIC API=======================*/

/**
 * Get the best move for the AI at the given difficulty level
 * @param {Object} state - Current game state
 * @param {string} difficulty - One of: 'easy', 'medium', 'hard', 'expert'
 * @returns {Object|null} - Best move object or null if no moves available
 */
export function getAIMove(state, difficulty) {
  console.log(`AI thinking at difficulty: ${difficulty}...`);

  // Get search depth based on difficulty
  const depth = DIFFICULTY_DEPTHS[difficulty] || DIFFICULTY_DEPTHS.medium;

  // If no legal moves, return null
  if (!state.legalMoves || state.legalMoves.length === 0) {
    console.log("No legal moves available for AI");
    return null;
  }

  // Run minimax
  const result = minimax(
    state,
    depth,
    -Infinity,
    Infinity,
    true,
    state.turn
  );

  console.log(`AI chose move with score: ${result.score}`);
  return result.move;
}
