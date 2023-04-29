const socketIO = require("socket.io");
const express = require("express");
const process = require("process");
const PORT = process.env.PORT || 8080;
const path = require("path");

const server = express()
  .use(express.static("public"))
  .use((req, res) => res.sendFile(path.join(__dirname, "/index.html")))
  .listen(PORT, () => console.log("listening on port " + PORT));

const io = socketIO(server);

const state = {};
const clientRooms = {};

// FORMULA
// 2 (R * C + (C - 1))
// OR
// 2 (R' * C' - C) // Where R' = R + 1 and C' = C + 1
// IF BOTH GIVE THE SAME ANSWER THEN THE ANSWER IS CORRECT
// IF BOTH GIVE DIFFERENT ANSWERS THEN THE ANSWER IS
// #1 + (#2 - #1) / 2

const R = 5;
const C = 7;
const Rp = R + 1;
const Cp = C + 1;
let numofbtns = 82;

let board = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
let space = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

let commonH = [];
let commonU = [];
let commonD = [];
let commonV = [];
let commonR = [];
let commonL = [];

console.log("started");

// On Connection //
io.on("connection", async (socket) => {
  console.log("connected");

  // DONE: Add end game screen and play again / leave option
  // DONE: Add scores.
  // DONE: Add welcome screen and rooms.
  // TODO: Add scores @ endscreen
  // AND PRETTY MUCH DONE WITH THIS PROJECT!!

  //MAYBE MAYBE!! add alertify.js for extra ease

  socket.emit("test");
  socket.on("disconnect", handleDisconnect);
  socket.on("clicked", handleClick);
  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  socket.on("playAgain", handlePlayAgain);
  socket.on("leaveRoom", handleLeaveRoom);

  function handleDisconnect(reason) {
    console.log(reason);
    console.log(socket.id);

    let gameCode = clientRooms[socket.id];

    if (gameCode == null) return;

    let P2;
    P2 = state[gameCode].P2;

    console.log(`result: ${P2}`);

    state[gameCode].P1 = P2;

    io.to(P2).emit("init", 1, 1);
  }

  function handleClick(btn, room, sender) {
    if (btn == 399) {
      io.to(room).emit("gameEnded", 1);

      state[room].board = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
      state[room].player = 1;
      io.to(room).emit("update", state[room]);
      return;
    }
    console.log("clicked");
    console.log(btn);

    if (state[room].player != sender) return;

    board = state[room].board;

    if (state[room].enabledBtns.includes(btn)) return;

    state[room].enabledBtns.push(btn);

    board = board.replaceAt(btn - 1, state[room].symbol);

    state[room].board = board;

    CheckV(btn, room);
    CheckH(btn, room);

    CheckPoint(room);
    alternatePlayer(room);

    state[room].playerOverride = false;

    io.to(room).emit("update", state[room]);

    if (state[room].enabledBtns.length == numofbtns) {
      if (state[room].p1score > state[room].p2score) io.to(room).emit("gameEnded", 1);
      if (state[room].p2score > state[room].p1score) io.to(room).emit("gameEnded", 2);
    }
  }

  function AddScore(trueid, room) {
    space = state[room].space;

    space = space.replaceAt(trueid - 1, state[room].symbol);

    state[room].playerOverride = true;
    state[room].space = space;

    if (state[room].player == 1) {
      state[room].p1score++;
    } else if (state[room].player == 2) {
      state[room].p2score++;
    }
  }

  function CheckPoint(room) {
    let y;
    let x;
    let trueid;
    let res;

    if (commonU.length == 4) {
      res = getLeast("U");
      y = getY(res);
      x = res % 15;
      trueid = x + 7 * y;

      AddScore(trueid, room);
    }
    if (commonD.length == 4) {
      res = getLeast("D");
      y = getY(res);
      x = res % 15;
      trueid = x + 7 * y;

      AddScore(trueid, room);
    }
    if (commonR.length == 4) {
      res = getLeast("R");
      y = getY(res);
      x = res % 15;
      trueid = x + 7 * y;

      AddScore(trueid, room);
    }
    if (commonL.length == 4) {
      res = getLeast("L");
      y = getY(res);
      x = res % 15;
      trueid = x + 7 * y;

      AddScore(trueid, room);
    }
  }

  function CheckV(btn, room) {
    commonH = [];
    commonU = [];
    commonD = [];

    if (!(btn % 15 >= 1 && btn % 15 <= 7)) return;

    for (let x = 0; x < state[room].enabledBtns.length; x++) {
      let button = state[room].enabledBtns[x];

      if (btn == button) {
        commonU.push(button);
        commonD.push(button);
      }

      let diff = button - btn;

      if (diff == -7 || diff == -8 || diff == -15) {
        commonU.push(button);
      } else if (diff == 7 || diff == 8 || diff == 15) {
        commonD.push(button);
      }
    }
  }

  function CheckH(btn, room) {
    commonV = [];
    commonR = [];
    commonL = [];

    if (!((btn % 15 >= 8 && btn % 15 <= 14) || btn % 15 == 0)) return;

    for (let y = 0; y < state[room].enabledBtns.length; y++) {
      let button = state[room].enabledBtns[y];

      if (btn == button) {
        commonR.push(button);
        commonL.push(button);
      }

      let diff = button - btn;

      if ((diff == -7 || diff == 1 || diff == 8) && btn % 15 != 0) {
        commonR.push(button);
      } else if ((diff == -8 || diff == -1 || diff == 7) && btn % 15 != 8) {
        commonL.push(button);
      }
    }
  }

  function handlePlayAgain(gameCode) {
    const room = io.sockets.adapter.rooms.get(gameCode);

    let socketNumber = 0;
    if (state[gameCode].P1 == socket.id) {
      socketNumber = 1;
    } else if (state[gameCode].P2 == socket.id) {
      socketNumber = 2;
    }

    if (state[gameCode].readyPlayers == 0) {
      let scoreP1 = state[gameCode].scoreP1;
      let scoreP2 = state[gameCode].scoreP2;
      let P1 = state[gameCode].P1;
      let P2 = state[gameCode].P2;

      state[gameCode] = createGameState();
      state[gameCode].readyPlayers = 1;

      state[gameCode].scoreP1 = scoreP1;
      state[gameCode].scoreP2 = scoreP2;
      state[gameCode].P1 = P1;
      state[gameCode].P2 = P2;

      socket.emit("init", socketNumber, state[gameCode].player);
    } else if (state[gameCode].readyPlayers == 1) {
      state[gameCode].readyPlayers = 0;
      socket.emit("init", socketNumber, state[gameCode].player);
      io.to(gameCode).emit("start");
    }

    console.log(state);
  }

  function handleLeaveRoom(gameCode) {
    const room = io.sockets.adapter.rooms.get(gameCode);

    let numClients = 0;
    let socketNumber;

    if (room) {
      numClients = room.size;
    }
    console.log(clientRooms[socket.id]);

    if (state[gameCode].P1 == socket.id) {
      socketNumber = 1;
    } else if (state[gameCode].P2 == socket.id) {
      socketNumber = 2;
    }

    if (socketNumber == 2) {
      delete clientRooms[socket.id];

      let P1 = state[gameCode].P1;

      state[gameCode] = createGameState();
      state[gameCode].readyPlayers = 1;

      state[gameCode].P1 = P1;

      socket.leave(gameCode);
      io.to(P1).emit("init", 1, 1);
    }

    if (socketNumber == 1) {
      if (numClients === 1) {
        delete state[gameCode];
        delete clientRooms[socket.id];
        socket.leave(gameCode);
      } else if (numClients === 2) {
        delete clientRooms[socket.id];

        if (socketNumber == 1) {
          socket.leave(gameCode);
          let P2;
          P2 = state[gameCode].P2;

          console.log(`result: ${P2}`);

          state[gameCode] = createGameState();
          state[gameCode].readyPlayers = 1;

          state[gameCode].P1 = P2;

          io.to(P2).emit("init", 1, 1);
        }
      }
    }

    console.log(room);
    console.log(clientRooms);
  }

  function handleJoinGame(gameCode) {
    const room = io.sockets.adapter.rooms.get(gameCode);
    console.log(room);

    let numClients = 0;
    if (room) {
      numClients = room.size;
    }

    if (numClients === 0) {
      socket.emit("unknownGame");
      console.log("unknownGame");
      return;
    } else if (numClients > 1) {
      socket.emit("tooManyPlayers");
      console.log("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = gameCode;

    socket.join(gameCode);
    state[gameCode].P2 = socket.id;

    console.log(state);
    console.log(clientRooms);

    socket.emit("gameCode", gameCode);
    socket.emit("init", 2, 1);
    io.to(gameCode).emit("start");
    socket.emit("update", state[gameCode]);

    console.log(room);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[socket.id] = roomName;
    socket.emit("gameCode", roomName);

    state[roomName] = createGameState();

    socket.join(roomName);
    state[roomName].P1 = socket.id;

    console.log(state);
    console.log(clientRooms);

    socket.emit("init", 1, 1);
  }

  function alternatePlayer(room) {
    if (state[room].playerOverride) return;
    if (state[room].player == 1) {
      state[room].player = 2;
      state[room].symbol = "B";
    } else if (state[room].player == 2) {
      state[room].player = 1;
      state[room].symbol = "R";
    }
  }

  function getLeast(list) {
    let result = 999;

    if (list == "U") {
      commonU.forEach((btn) => {
        if (+btn < result) {
          result = btn;
        }
      });

      return result;
    }
    if (list == "D") {
      commonD.forEach((btn) => {
        if (+btn < result) {
          result = btn;
        }
      });

      console.log(result);
      return result;
    }
    if (list == "R") {
      commonR.forEach((btn) => {
        if (+btn < result) {
          result = btn;
        }
      });

      return result;
    }
    if (list == "L") {
      commonL.forEach((btn) => {
        if (+btn < result) {
          result = btn;
        }
      });

      return result;
    }
  }

  function getY(id) {
    for (let i = 0; i < R; i++) {
      if (id <= C + 15 * i) return i;
    }
  }
});
String.prototype.bclear = function () {
  return "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
};

String.prototype.replaceAt = function (index, replacement) {
  if (index >= this.length) {
    return this.valueOf();
  }

  return this.substring(0, index) + replacement + this.substring(index + 1);
};

function createGameState() {
  return {
    player: 1,
    playerOverride: false,
    symbol: "R",
    board: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    space: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    enabledBtns: [],
    p1score: 0,
    p2score: 0,
    readyPlayers: 0,
    P1: 0,
    P2: 0,
  };
}

function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var some = 0; some < length; some++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
