/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
// const boardValues = [];
// const possibleMoveIndices = [];
// const possibleJumps = {};
const boardCells = document.querySelectorAll("div.game > div.cell");
const msgCell = document.querySelector("#message");

/*===========================VARIABLES=======================*/

const state = {};

const ui = {};

/*===========================ENGINE HELPERS (GRID + RULES)=======================*/

function getRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

function getColIndex(cellId) {
  const rowIdx = getRowIndex(cellId);
  const rowStartIdx = rowIdx * 8;
  // console.log(`
  //   Cell ${cellId} is in row ${rowIdx} which starts at ${rowStartIdx} and ends at ${rowEndIdx}
  //   `);
  return cellId * 1 - rowStartIdx;
}

function getCellIndex(rowIndex, colIndex) {
  if (rowIndex > 7 || rowIndex < 0 || colIndex > 7 || colIndex < 0)
    return false;
  return rowIndex * 8 + colIndex;
}

function getCellValue(state, cellIndex) {
  return state.boardValues[cellIndex];
}

function isCellEmpty(state, cellIndex) {
  return getCellValue(state, cellIndex) === "";
}

function isCellEnemy(state, cellIndex) {
  if (cellIndex === false) return false;
  const cellVal = getCellValue(state, cellIndex);
  if (cellVal === "") return false;
  return cellVal.split("_")[0] !== state.turn;
}

function isInLastRow(state, cellId) {
  const rowIndex = getRowIndex(cellId);
  const player = getCellValue(state, cellId).split("_")[0];
  return (
    (player === players[0] && rowIndex === 7) ||
    (player === players[1] && rowIndex === 0)
  );
}

function isOnBoard(idx) {
  return idx >= 0 && idx <= 7;
}

//add backwards king functionality later
function getValidMoveRows(state, cellId) {
  const rowIndex = getRowIndex(cellId);
  const cellValue = state.boardValues[cellId];
  const [player, pieceType] = cellValue.split("_");
  const [nextRowIdx, prevRowIdx] = [rowIndex + 1, rowIndex - 1];
  const idxs = [];
  // console.log(player, pieceType, rowIndex, nextRowIdx);
  if (pieceType === "King") {
    if (nextRowIdx <= 7) idxs.push(nextRowIdx);
    if (prevRowIdx >= 0) idxs.push(prevRowIdx);
  } else if (state.turn === players[0] && nextRowIdx <= 7) {
    idxs.push(nextRowIdx);
  } else if (state.turn === players[1] && prevRowIdx >= 0) {
    idxs.push(prevRowIdx);
  }
  return idxs;
}

function getValidMoveCols(state, cellId) {
  const colIndex = getColIndex(cellId);
  return [colIndex + 1, colIndex - 1].filter(isOnBoard);
}

function getValidNeighbors(state, cell) {
  const adjRows = getValidMoveRows(state, cell);
  const adjCols = getValidMoveCols(state, cell);
  const neighbors = adjRows
    .map((rowIdx) => {
      return adjCols.map((colIdx) => {
        return getCellIndex(rowIdx, colIdx); //[rowIdx, colIdx];
      });
    })
    .flat();
  return neighbors;
}

/*===========================ENGINE CORE=======================*/

function addPiece(state, index, player, pieceType) {
  state.boardValues[index] = `${player}_${pieceType}`;
}

function hasPiece(state, index) {
  return state.boardValues[index] !== "";
}

function removePiece(state, index) {
  const pieceValue = state.boardValues[index];
  state.boardValues[index] = "";
  return pieceValue;
}

function crownPiece(state, index) {
  // if (isInLastRow(index)) {
  state.boardValues[index] = state.boardValues[index].replace(
    "Regular",
    "King"
  );
  // boardCells[index].querySelector("div").textContent = "King";
  // }
}

function movePiece(state, fromIdx, toIdx) {
  console.log(`Moving ${fromIdx} to ${toIdx}`);
  const [player, pieceType] = removePiece(state, fromIdx).split("_");
  addPiece(state, toIdx, player, pieceType);
  if (isInLastRow(state, toIdx)) {
    console.log(`Piece is in last row; making king`);
    crownPiece(state, toIdx);
  }
}

function executeMove(state, move) {
  // Apply full path
  const startPos = move.path[0];
  const endPos = move.path[move.path.length - 1];

  const [player, pieceType] = removePiece(state, startPos).split("_");
  addPiece(state, endPos, player, pieceType);

  // Remove all captures
  move.captures.forEach((idx) => removePiece(state, idx));

  // Crown if reached end
  if (isInLastRow(state, endPos)) {
    crownPiece(state, endPos);
  }

  // Clean up and switch turn
  switchPlayerTurn(state);
  unselectPiece(state);
  checkForWinner(state);
}

function checkForWinner(state) {
  const boardString = state.boardValues.join(" ");
  if (!boardString.includes(state.players[0])) {
    state.winner = state.players[1];
  } else if (!boardString.includes(state.players[1])) {
    state.winner = state.players[0];
  }
  console.log(`Checking for winner....${state.winner}`);
}

function checkForTie(state) {}

function switchPlayerTurn(state) {
  state.turn =
    state.turn === state.players[0] ? state.players[1] : state.players[0];
  // updateLegalMoves(state);
  state.legalMoves = generateAllLegalMoves(state);
}

// Apply a complete move to the state
// Takes the full path and all captures, returns new state
function applyMove(state, move) {
  const stateClone = structuredClone(state);
  const startPos = move.path[0];
  const endPos = move.path[move.path.length - 1];

  // Move the piece from start to end
  stateClone.boardValues[endPos] = stateClone.boardValues[startPos];
  if (endPos !== startPos) stateClone.boardValues[startPos] = "";

  // Remove all captured pieces
  move.captures.forEach((cell) => (stateClone.boardValues[cell] = ""));

  return stateClone;
}

// Returns list of possible single jumps from square at index pos
function findSingleJumps(state, pos) {
  const { boardValues, turn } = state;
  const moves = [];
  if (!boardValues[pos].startsWith(turn)) return moves;

  const neighbors = getValidNeighbors(state, pos);
  const [row, col] = [getRowIndex(pos), getColIndex(pos)];

  for (const neighbor of neighbors) {
    if (!isCellEnemy(state, neighbor)) continue;

    const [landingRow, landingCol] = [
      getRowIndex(neighbor),
      getColIndex(neighbor),
    ];
    const [rowDiff, colDiff] = [landingRow - row, landingCol - col];
    const jumpCoords = [row + rowDiff * 2, col + colDiff * 2];
    const jumpToId = getCellIndex(...jumpCoords);

    if (jumpToId !== false && isCellEmpty(state, jumpToId)) {
      moves.push({
        path: [pos, jumpToId],
        captures: [neighbor],
        type: "jump",
      });
    }
  }
  return moves;
}

// Returns continuation jumps from the current move
function findContinuationJumps(state, move) {
  const stateClone = applyMove(state, move);
  const curPos = move.path[move.path.length - 1];
  const continuationJumps = findSingleJumps(stateClone, curPos);

  return continuationJumps.map((continuationJump) => {
    return {
      path: [
        ...move.path,
        continuationJump.path[continuationJump.path.length - 1],
      ],
      captures: [
        ...move.captures,
        continuationJump.captures[continuationJump.captures.length - 1],
      ],
      type: "jump",
    };
  });
}

// DFS to find all complete jump sequences
function jumpDFS(state, move, results) {
  const continuations = findContinuationJumps(state, move);

  if (continuations.length === 0) {
    results.push(move);
    return results;
  }

  for (const nextMove of continuations) {
    jumpDFS(state, nextMove, results);
  }

  return results;
}

// Find all possible jump paths for the current player
function findAllJumpPaths(state) {
  const results = [];

  state.boardValues.forEach((cellValue, cellIndex) => {
    const jumps = findSingleJumps(state, cellIndex);
    jumps.forEach((jump) => {
      jumpDFS(state, jump, results);
    });
  });

  return results;
}

function generateAllLegalMoves(state) {
  const regularMoves = [];
  const jumpPaths = findAllJumpPaths(state);

  // Only generate regular moves if no jumps available (forced capture rule)
  if (jumpPaths.length === 0 || !state.forcedCaptures) {
    state.boardValues.forEach((cellValue, cellIndex) => {
      if (!cellValue.startsWith(state.turn)) return;

      const neighbors = getValidNeighbors(state, cellIndex);
      neighbors.forEach((neighbor) => {
        if (isCellEmpty(state, neighbor)) {
          regularMoves.push({
            path: [cellIndex, neighbor],
            captures: [],
            type: "regular",
          });
        }
      });
    });
  }

  // If forced captures and jumps exist, return only jumps
  if (state.forcedCaptures && jumpPaths.length > 0) {
    return jumpPaths;
  }

  return [...regularMoves, ...jumpPaths];
}

function initializeGame(state) {
  state.winner = false;
  state.isTie = false;
  state.legalMoves = [];
  state.boardValues = [];
  state.players = ["White", "Black"];
  state.pieceTypes = ["Regular", "King"];
  state.turn = state.players[0];
  state.isJumping = false;
  state.forcedCaptures = false;
  for (let i = 0; i < 64; i++) {
    // removePiece(state, i);
    const isCellEven = i % 2 === 0;
    const rowIndex = getRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const cell = boardCells[i];
    const isPlayer1 = rowIndex < 3;
    const isPlayer2 = rowIndex > 4;
    const isPiece =
      (isPlayer1 || isPlayer2) &&
      ((isRowEven && isCellEven) || (!isRowEven && !isCellEven));
    const isDark = (isRowEven && isCellEven) || (!isRowEven && !isCellEven);

    if (isPlayer1 && isPiece) {
      addPiece(state, i, players[0], "Regular");
    } else if (isPlayer2 && isPiece) {
      addPiece(state, i, players[1], "Regular");
    } else {
      removePiece(state, i);
    }
  }
  // updateLegalMoves(state);
  state.legalMoves = generateAllLegalMoves(state);
}

function initializeUI(state, ui) {
  ui.selectedPieceIndex = null;
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};
  ui.isCapturing = false;
  ui.capturePos = null;
  ui.captureStart = null;
  ui.captureCursor = 0;
  ui.activeJumpSequences = [];
  for (let i = 0; i < 64; i++) {
    const isCellEven = i % 2 === 0;
    const rowIndex = getRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const cell = boardCells[i];
    const isDark = (isRowEven && isCellEven) || (!isRowEven && !isCellEven);

    if (isDark) {
      cell.classList.add("dark");
      // playableIndices.push(i);
    }
  }
}

function initialize(state, ui) {
  initializeGame(state);
  initializeUI(state, ui);
  render(state, ui);
}

/*===========================UI=======================*/

function updateMessage(msg) {
  msgCell.textContent = msg;
}

function render(state, ui) {
  console.log("Rendering...");
  boardCells.forEach((cell, index) => {
    const cellValue = state.boardValues[index];

    // check if cell has a piece
    // if so, update cell's classes to reflect this
    if (cellValue.startsWith(state.players[0])) {
      cell.classList.add("has-piece", state.players[0]);
      cell.classList.remove(state.players[1]);
      if (cellValue.endsWith(state.pieceTypes[1])) {
        cell.classList.add(state.pieceTypes[1]);
      }
    } else if (cellValue.startsWith(state.players[1])) {
      cell.classList.add("has-piece", state.players[1]);
      cell.classList.remove(state.players[0]);
      if (cellValue.endsWith(state.pieceTypes[1])) {
        cell.classList.add(state.pieceTypes[1]);
      }
    } else {
      cell.classList.remove(
        "has-piece",
        state.players[1],
        state.players[0],
        state.pieceTypes[1]
      );
    }

    // check if cell is selected
    // if so, update class to reflect this
    if (index === ui.selectedPieceIndex) cell.classList.add("selected");
    else cell.classList.remove("selected");
    // check if cell is a possible mvoe
    // if so, update class to reflect this
    if (ui.possibleMoveIndices.includes(index) || index in ui.possibleJumps)
      cell.classList.add("possible-move");
    else cell.classList.remove("possible-move");

    //check if cell is king and change to reflect
    if (cellValue.includes("King")) {
      cell.classList.add("King");
    } else {
      cell.classList.remove("King");
    }
  });

  if (state.winner)
    updateMessage(
      `Congratulations, player ${state.winner}! Hit reset to play again.`
    );
  else updateMessage(`It is player ${state.turn}'s turn`);
}
// Updated to use dfs
function selectPiece(state, cellIndex) {
  ui.selectedPieceIndex = cellIndex;

  // If in capture mode, only allow selecting the capturing piece
  if (ui.isCapturing) {
    if (cellIndex !== ui.capturePos) return;
    ui.possibleMoveIndices = [];
    ui.possibleJumps = {};

    // Build next-hop options from activeJumpSequences
    for (const seq of ui.activeJumpSequences) {
      if (seq.path.length > ui.captureCursor) {
        const nextLanding = seq.path[ui.captureCursor];
        if (!ui.possibleJumps[nextLanding]) {
          ui.possibleJumps[nextLanding] = [];
        }
        ui.possibleJumps[nextLanding].push(seq);
      }
    }

    // If no more hops available, end capture sequence
    if (Object.keys(ui.possibleJumps).length === 0) {
      handleEndJumpSeq(state, ui);
    }
    return;
  }

  // Filter moves that start from this cell
  const pieceMoves = state.legalMoves.filter((m) => m.path[0] === cellIndex);

  // Separate for UI rendering
  ui.possibleMoveIndices = pieceMoves
    .filter((m) => m.type === "regular")
    .map((m) => m.path[m.path.length - 1]);

  // Build possibleJumps keyed by first-hop landing square (path[1])
  // Store arrays to handle multiple sequences sharing the same first hop
  ui.possibleJumps = {};
  pieceMoves
    .filter((m) => m.type === "jump")
    .forEach((move) => {
      const firstHop = move.path[1];
      if (!ui.possibleJumps[firstHop]) {
        ui.possibleJumps[firstHop] = [];
      }
      ui.possibleJumps[firstHop].push(move);
    });
}

function unselectPiece(state) {
  ui.selectedPieceIndex = null;
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};
  // state.legalMoves = [];
}

initialize(state, ui);

/*===========================EVENT LISTENERS=======================*/

function handleRegularClick(state, ui, cellIndex) {
  const isPiece = hasPiece(state, cellIndex);
  const cellValue = state.boardValues[cellIndex];
  const isTurn = cellValue && state.turn === cellValue.split("_")[0];

  console.log(`Board clicked at cell ${cellIndex}.
     isPiece: ${isPiece}
     cellValue: ${cellValue}`);

  if (isPiece && isTurn) {
    unselectPiece(state);
    selectPiece(state, cellIndex);
    return true;
  }

  // Check if clicking a regular move destination
  if (ui.possibleMoveIndices.includes(cellIndex)) {
    const selectedMove = state.legalMoves.find(
      (m) =>
        m.path[0] === ui.selectedPieceIndex &&
        m.path[m.path.length - 1] === cellIndex &&
        m.type === "regular"
    );
    if (selectedMove) {
      console.log(`Executing regular move: ${selectedMove.path.join(" -> ")}`);
      executeMove(state, selectedMove);
      return true;
    }
  }

  // Check if clicking a jump destination (first hop)
  if (cellIndex in ui.possibleJumps) {
    handleStartJumpSeq(state, ui, cellIndex);
    return true;
  }

  return false;
}

function handleStartJumpSeq(state, ui, cellIndex) {
  // Get all sequences that start with this first hop
  ui.activeJumpSequences = ui.possibleJumps[cellIndex];

  if (!ui.activeJumpSequences || ui.activeJumpSequences.length === 0) return;

  // Use first sequence to determine the hop details (all should agree on first hop)
  const seq = ui.activeJumpSequences[0];
  const from = seq.path[0];
  const to = seq.path[1];
  const captured = seq.captures[0];

  console.log(
    `Starting jump sequence: hop from ${from} to ${to}, capturing ${captured}`
  );

  // Apply first hop
  movePiece(state, from, to);
  removePiece(state, captured);
  // if (isInLastRow(state, to)) {
  //   crownPiece(state, to);
  // }

  // Enter capture mode
  ui.isCapturing = true;
  ui.capturePos = to;
  ui.captureStart = from;
  ui.selectedPieceIndex = to;
  ui.captureCursor = 2; // Next hop would be at path[2]
  ui.possibleMoveIndices = [];
  ui.possibleJumps = {};

  // Build next-hop options from remaining sequences
  for (const s of ui.activeJumpSequences) {
    if (s.path.length > ui.captureCursor) {
      const nextLanding = s.path[ui.captureCursor];
      if (!ui.possibleJumps[nextLanding]) {
        ui.possibleJumps[nextLanding] = [];
      }
      ui.possibleJumps[nextLanding].push(s);
    }
  }

  // If no more hops available, end sequence
  if (Object.keys(ui.possibleJumps).length === 0) {
    handleEndJumpSeq(state, ui);
  }
}

function handleContinueJumpSeq(state, ui, cellIndex) {
  // Narrow to sequences that match this hop
  ui.activeJumpSequences = ui.possibleJumps[cellIndex];

  if (!ui.activeJumpSequences || ui.activeJumpSequences.length === 0) return;

  // Use first sequence to determine the hop details
  const seq = ui.activeJumpSequences[0];
  const from = ui.capturePos;
  const to = cellIndex;
  const captureIndex = ui.captureCursor - 1; // captureCursor tracks path index, captures are 0-indexed
  const captured = seq.captures[captureIndex];

  console.log(
    `Continuing jump: hop from ${from} to ${to}, capturing ${captured}`
  );

  // Apply hop
  movePiece(state, from, to);
  removePiece(state, captured);
  // if (isInLastRow(state, to)) {
  //   crownPiece(state, to);
  // }

  // Update capture state
  ui.capturePos = to;
  ui.selectedPieceIndex = to;
  ui.captureCursor++;
  ui.possibleJumps = {};

  // Build next-hop options from remaining sequences
  for (const s of ui.activeJumpSequences) {
    if (s.path.length > ui.captureCursor) {
      const nextLanding = s.path[ui.captureCursor];
      if (!ui.possibleJumps[nextLanding]) {
        ui.possibleJumps[nextLanding] = [];
      }
      ui.possibleJumps[nextLanding].push(s);
    }
  }

  // If no more hops available, end sequence
  if (Object.keys(ui.possibleJumps).length === 0) {
    handleEndJumpSeq(state, ui);
  }
}

function handleEndJumpSeq(state, ui) {
  console.log("Ending jump sequence");

  // Clear capture state
  ui.isCapturing = false;
  ui.capturePos = null;
  ui.captureStart = null;
  ui.captureCursor = 0;
  ui.activeJumpSequences = [];
  unselectPiece(state);

  // End turn
  switchPlayerTurn(state);
  checkForWinner(state);
  checkForTie(state);
}

function handleClick(event) {
  if (state.winner || state.isTie) return;

  const el = event.currentTarget;
  const cellIndex = el.id * 1;

  let changed = false;

  if (ui.isCapturing) {
    // In capture mode: only process continuation jumps
    if (cellIndex in ui.possibleJumps) {
      handleContinueJumpSeq(state, ui, cellIndex);
      changed = true;
    }
  } else {
    // Normal mode: handle piece selection, regular moves, or jump starts
    changed = handleRegularClick(state, ui, cellIndex);
  }

  if (changed) {
    render(state, ui);
  }
}

document.querySelectorAll("#game div.cell").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});

document
  .querySelector("#reset")
  .addEventListener("click", () => initialize(state, ui));

/*===========================TEST HELPERS=======================*/

function clearPlayerPieces(state, playerIdx = 0) {
  state.boardValues.forEach((val, i) => {
    if (val.includes(state.players[playerIdx])) state.boardValues[i] = "";
  });
  checkForWinner(state);
  checkForTie(state);
  render(state);
}
