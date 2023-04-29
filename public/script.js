const socket = io();

let i = 1;
let n = 1;
let o = 1;
let hor = true;
let count = 0;
let playerOverride = false;

const R = 5;
const C = 7;
const Rp = R + 1;
const Cp = C + 1;
let room;
let playerNumber;
let enabled = false;
let p1score = 0;
let p2score = 0;

for (let h = 0; h < R; h++) {
  CreateElements();
}
CreateEndRow();

const gameScreen = document.getElementById("gameScreen"); //////// Game screen
const welcomeScreen = document.getElementById("welcomeScreen"); // Welcome screen
const endScreen = document.getElementById("endScreen"); ////////// End screen

const codeText = document.getElementById("codeText"); //////////// Text where code is displayed
const pTurnText = document.getElementById("pTurnText"); ////////// Text showing which player's turn
const p1text = document.getElementById("p1scoreText"); /////////// Text P1's score
const p2text = document.getElementById("p2scoreText"); /////////// Text P2's score
const winnerText = document.getElementById("winnerText"); //////// Text for who won
const scoresText = document.getElementById("scoresText"); //////// Text where wins are showed

const codeInput = document.getElementById("codeInput"); ////////// Input the code

const connectioDiv = document.getElementById("connectioDiv"); //// Div showing connection info
const waitDiv = document.getElementById("waitDiv"); ////////////// Div showing wait message
const youAreDiv = document.getElementById("youAreDiv"); ////////// Div showing which player u are

let playerColor;
let playerDarkColor;

socket.on("test", handleTest);
socket.on("update", handleUpdate);
socket.on("gameCode", handleGameCode);
socket.on("init", handleInit);
socket.on("start", handleStart);
socket.on("gameEnded", handleGameEnded);

function handleStart() {
  enabled = true;
}

function handleGameEnded(winner) {
  // console.log("Game ended");

  winnerText.innerHTML = `Player ${winner} wins!`;

  gameScreen.style.display = "none";
  endScreen.style.display = "flex";

  if (winner == 1) p1score++;
  else if (winner == 2) p2score++;

  scoresText.innerHTML = `P1:${p1score}<br>P2:${p2score}`;

  enabled = false;
}

function init() {
  welcomeScreen.style.display = "none";
  endScreen.style.display = "none";
  gameScreen.style.display = "block";
  youAreDiv.innerHTML = `You are Player ${playerNumber} (${playerColor.toUpperCase()})`;

  codeText.innerHTML = `The Code is: ${room}`;
  enabled = false;
}

function handleInit(number, p) {
  // console.log("called");
  playerNumber = number;

  if (playerNumber == 1) {
    playerColor = "red";
    playerDarkColor = "darkred";
  }
  if (playerNumber == 2) {
    playerColor = "blue";
    playerDarkColor = "darkblue";
  }

  init();
}

function handleTest() {
  // console.log("tested");
  connectionDiv.innerHTML = "Connected";
  waitDiv.style.display = "none";
}

function handleGameCode(gameCode) {
  room = gameCode;
}

function handleUpdate(state) {
  // console.log(state.board);

  p1text.innerHTML = `P1: ${state.p1score}`;
  p2text.innerHTML = `P2: ${state.p2score}`;

  if (state.player == 1) {
    pTurnText.innerHTML = "P1";
    pTurnText.style.color = "red";
  } else if (state.player == 2) {
    pTurnText.innerHTML = "P2";
    pTurnText.style.color = "blue";
  }

  for (let index = 1; index < state.board.length + 1; index++) {
    let ch = state.board.charAt(index - 1);

    if (ch == "X") {
      btn = document.getElementById("btn" + index);
      btn.style.background = "gray";
    } else if (ch == "R") {
      btn = document.getElementById("btn" + index);
      btn.style.background = "red";
    } else if (ch == "B") {
      btn = document.getElementById("btn" + index);
      btn.style.background = "blue";
    }
  }

  for (let index = 1; index < state.space.length + 1; index++) {
    let spc;
    let ch = state.space.charAt(index - 1);

    if (ch == "X") {
      spc = document.getElementById("spc" + index);
      spc.style.background = "rgb(64, 64, 64)";
    } else if (ch == "R") {
      spc = document.getElementById("spc" + index);
      spc.style.background = "darkred";
      spc.innerHTML = "P1";
    } else if (ch == "B") {
      spc = document.getElementById("spc" + index);
      spc.style.background = "darkblue";
      spc.innerHTML = "P2";
    }
  }
}

function menuClicked(sender) {
  // console.log(sender);
  if (sender == "createGameBtn") {
    socket.emit("newGame");
  } else if (sender == "joinGameBtn") {
    socket.emit("joinGame", codeInput.value);
  } else if (sender == "playAgainBtn") {
    socket.emit("playAgain", room);
    endScreen.style.display = "none";
    gameScreen.style.display = "flex";
    init();
  } else if (sender == "leaveRoomBtn") {
    socket.emit("leaveRoom", room);
    endScreen.style.display = "none";
    welcomeScreen.style.display = "flex";
  }
}

function clicked(sender) {
  if (!enabled) return;

  if (+sender == 399) {
    socket.emit("clicked", 399, room, playerNumber);
    return;
  }

  if (sender.length == 4) {
    sender = sender.substring(3, 4);
  } else if (sender.length == 5) {
    sender = sender.substring(3, 5);
  }

  let btn = document.getElementById(`btn${sender}`);

  if (btn.style.background != "red" && btn.style.background != "blue") socket.emit("clicked", sender, room, playerNumber);
}

function UpdateScoreBoard() {
  p1text.innerHTML = `P1:${p1score}`;
  p2text.innerHTML = `P2:${p2score}`;
}

function CreateElements() {
  if (hor) {
    let div = document.createElement("div");
    div.className = `container c${i}`;
    i++;

    for (let j = 0; j < C; j++) {
      let btn = document.createElement("button");
      btn.id = `btn${n}`;
      n++;
      if (j == 0) {
        btn.className = "btn btn-hor btn-corner btn-left";
      } else if (j == 1 || j == 2) {
        btn.className = "btn btn-hor btn-left";
      } else if (j == 3) {
        btn.className = "btn btn-hor btn-left btn-mid";
      } else if (j == 4) {
        btn.className = "btn btn-hor btn-right btn-mid";
      } else if (j == 5 || j == 6) {
        btn.className = "btn btn-hor btn-right";
      } else if (j == 7) {
        btn.className = "btn btn-hor btn-corner btn-right";
      }
      btn.addEventListener("click", function () {
        clicked(btn.id);
      });

      btn.addEventListener("mouseover", function () {
        if (btn.style.background == "gray") btn.style.backgroundColor = "darkgray";
      });
      btn.addEventListener("mouseout", function () {
        if (btn.style.background == "darkgray") btn.style.backgroundColor = "gray";
      });

      div.appendChild(btn);
    }
    gameDiv.appendChild(div);
    hor = false;
  }
  if (!hor) {
    let div = document.createElement("div");
    div.className = `container c${i}`;
    i++;

    for (let j = 0; j < C + 1; j++) {
      let btn = document.createElement("button");
      btn.id = `btn${n}`;
      n++;
      if (j == 0) {
        btn.className = "btn btn-ver btn-corner btn-left";
      } else if (j == 1 || j == 2 || j == 3) {
        btn.className = "btn btn-ver btn-left";
      } else if (j == 4) {
        btn.className = "btn btn-ver btn-mid";
      } else if (j == 5 || j == 6 || j == 7) {
        btn.className = "btn btn-ver btn-right";
      } else if (j == 8) {
        btn.className = "btn btn-ver btn-corner btn-right";
      }
      btn.addEventListener("click", function () {
        clicked(btn.id);
      });

      btn.addEventListener("mouseover", function () {
        if (btn.style.background == "gray") btn.style.backgroundColor = "darkgray";
      });
      btn.addEventListener("mouseout", function () {
        if (btn.style.background == "darkgray") btn.style.backgroundColor = "gray";
      });

      div.appendChild(btn);

      if (j != C) {
        let newDiv = document.createElement("button");
        newDiv.style.height = "4rem";
        newDiv.style.width = "4rem";
        newDiv.style.margin = "0rem";
        newDiv.style.border = "none";
        newDiv.className = "spc";
        newDiv.id = `spc${o}`;
        o++;
        div.appendChild(newDiv);
      }
    }
    gameDiv.appendChild(div);
    hor = true;
  }
}

function CreateEndRow() {
  let div = document.createElement("div");
  div.className = `container c${i}`;
  i++;

  for (let j = 0; j < C; j++) {
    let btn = document.createElement("button");
    btn.id = `btn${n}`;
    n++;
    if (j == 0) {
      btn.className = "btn btn-hor btn-corner btn-left";
    } else if (j == 1 || j == 2) {
      btn.className = "btn btn-hor btn-left";
    } else if (j == 3) {
      btn.className = "btn btn-hor btn-left btn-mid";
    } else if (j == 4) {
      btn.className = "btn btn-hor btn-right btn-mid";
    } else if (j == 5 || j == 6) {
      btn.className = "btn btn-hor btn-right";
    } else if (j == 7) {
      btn.className = "btn btn-hor btn-corner btn-right";
    }
    btn.addEventListener("click", function () {
      clicked(btn.id);
    });

    btn.addEventListener("mouseover", function () {
      if (btn.style.background == "gray") btn.style.backgroundColor = "darkgray";
    });
    btn.addEventListener("mouseout", function () {
      if (btn.style.background == "darkgray") btn.style.backgroundColor = "gray";
    });
    div.appendChild(btn);
  }
  gameDiv.appendChild(div);
}
