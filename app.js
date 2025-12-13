// const { cloneElement } = require("react");

/*===========================CONSTANTS=======================*/

const players = ["W", "B"];
const pieceTypes = ["Regular", "King"];
const boardValues = [];
const boardCells = document.querySelectorAll("div.game > div.cell");

/*===========================HELPER FUNCTIONS=======================*/

function computeRowIndex(cellId) {
  return Math.floor(cellId / 8);
}

function addPiece(index, player, isKing = false) {
  boardValues[index] = `player${player}`;
}

function hasPiece(index) {
  return cellValues[index] !== "";
}

function removePiece(index) {
  boardValues[index] = "";
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
      addPiece(i, 0);
      //   boardValues[i] = "W";
    } else if (isPlayer2 && isPiece) {
      //   boardValues[i] = "B";
      addPiece(i, 1);
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

function updateBoard() {
  boardCells.forEach((cell, index) => {
    const cellValue = boardValues[index];
    if (cellValue === "player0") {
      cell.classList.add("has-piece", "white");
    } else if (cellValue === "player1") {
      cell.classList.add("has-piece", "black");
    } else {
      cell.classList.remove("has-piece", "black", "white");
    }
  });
}

function render() {
  updateBoard();
}

initialize();
