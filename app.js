// const { cloneElement } = require("react");

/*===========================CONSTANTS=======================*/

const players = ["White", "Black"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const boardCells = document.querySelectorAll("div.game > div.cell");
const turn = "White";
const isWinner = false;
const isTie = false;

/*===========================HELPER FUNCTIONS=======================*/

function computeRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

/*===========================INITIALIZATION=======================*/

function initialize() {
  for (let i = 0; i < 64; i++) {
    const isCellEven = i % 2 === 0;
    const rowIndex = computeRowIndex(i);
    const isRowEven = rowIndex % 2 === 0;
    const cell = boardCells[i];
    const isPlayer1 = rowIndex < 3;
    const isPlayer2 = rowIndex > 4;
    const isPiece =
      (isPlayer1 || isPlayer2) &&
      ((isRowEven && isCellEven) || (!isRowEven && !isCellEven));
    const isDark = (isRowEven && isCellEven) || (!isRowEven && !isCellEven);

    if (isPlayer1 && isPiece) {
      addPiece(i, players[0], "Regular");
    } else if (isPlayer2 && isPiece) {
      addPiece(i, players[1], "Regular");
    } else {
      removePiece(i);
    }

    if (isDark) {
      cell.classList.add("dark");
    }
  }
  render();
}

/*===========================RENDER=======================*/

function render() {
  boardCells.forEach((cell, index) => {
    const cellValue = boardValues[index];
    if (cellValue.startsWith(players[0])) {
      cell.classList.add("has-piece", "white");
      if (cellValue.endsWith("king")) {
        cell.classList.add("king");
      }
    } else if (cellValue.startsWith(players[1])) {
      cell.classList.add("has-piece", "black");
      if (cellValue.endsWith("king")) {
        cell.classList.add("king");
      }
    } else {
      cell.classList.remove("has-piece", "black", "white", "king");
    }
  });
}

/*===========================GAME LOGIC=======================*/
function addPiece(index, player, pieceType) {
  boardValues[index] = `${player}_${pieceType}`;
}

function hasPiece(index) {
  return boardValues[index] !== "";
}

function removePiece(index) {
  const pieceValue = boardValues[index];
  boardValues[index] = "";
  return pieceValue;
}

function crownPiece(index) {}

function movePiece(fromIdx, toIdx) {
  const [player, pieceType] = removePiece(fromIdx).split("_");
  addPiece(toIdx, player, pieceType);
}

function hasDoubleJump(fromIdx) {}

function getLegalMoves(index) {
  const rowIndex = computeRowIndex(index);
  const cell = boardCells[index];
}

function checkForWinner() {}

function checkForTie() {}

function switchPlayerTurn() {}

initialize();

/*===========================EVENT LISTENERS=======================*/

function handleClick(event) {
  const clickedElem = event.target;
  const cellIndex = clickedElem.parentNode.id * 1;
  const cell = boardCells[cellIndex];
  const isPiece = hasPiece(cellIndex);
  const cellValue = boardValues[cellIndex];
  const isTurn = turn === cellValue.split("_")[0];
  console.log(
    `Clicked ${cellIndex}
    Has piece: ${isPiece}
    Cell value: ${cellValue}
    Is player's turn: ${isTurn}
    `
  );

  checkForWinner();
  checkForTie();
  switchPlayerTurn();
  render();
}

document.querySelectorAll("#game div.cell > div").forEach((cell) => {
  cell.addEventListener("click", handleClick);
});
