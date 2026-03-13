const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
const cors    = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

// { [roomId]: { players: { [socketId]: {username,x,y,charIndex} }, nextCharacterIndex } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("create-room", (data) => {
    const roomId = nanoid(8);
    rooms[roomId] = { players: {}, nextCharacterIndex: 1 };
    socket.join(roomId);

    rooms[roomId].players[socket.id] = {
      username: data.username, x: 256, y: 160,
      charIndex: rooms[roomId].nextCharacterIndex++,
    };

    console.log(`Room ${roomId} created by ${data.username}`);
    socket.emit("room-created", {
      roomId,
      charIndex: rooms[roomId].players[socket.id].charIndex,
    });

    io.to(roomId).emit("player-joined", {
      id: socket.id, username: data.username,
      players: rooms[roomId].players,
    });
  });

  socket.on("join-room", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      socket.emit("join-error", { message: "Room does not exist" });
      return;
    }
    if (rooms[roomId].players[socket.id]) return;
    if (Object.keys(rooms[roomId].players).length >= 6) {
      socket.emit("join-error", { message: "Room is full" });
      return;
    }

    socket.join(roomId);
    rooms[roomId].players[socket.id] = {
      username, x: 256, y: 160,
      charIndex: rooms[roomId].nextCharacterIndex++,
    };

    console.log(`Player ${username} joined room ${roomId}`);
    io.to(roomId).emit("player-joined", {
      id: socket.id, username, players: rooms[roomId].players,
    });
  });

  socket.on("player-move", ({ roomId, x, y, direction, flipX }) => {
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].x = x;
      rooms[roomId].players[socket.id].y = y;
    }
    socket.to(roomId).emit("player-moved", { id: socket.id, x, y, direction, flipX });
  });

  socket.on("get-room-state", ({ roomId }) => {
    if (!rooms[roomId]) return;
    socket.emit("room-state", { players: rooms[roomId].players });
  });

  socket.on("chat-message", ({ roomId, username, text }) => {
    if (!rooms[roomId]) return;
    if (!text?.trim())  return;

    socket.to(roomId).emit("chat-message", {
      username,
      text: text.trim().slice(0, 300),
      ts: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        const { username } = room.players[socket.id];
        delete room.players[socket.id];
        console.log(`${username} left room ${roomId}`);
        io.to(roomId).emit("player-left", { id: socket.id, username });
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted — empty`);
        }
        break;
      }
    }
  });
});

const PORT = 4001;
server.listen(PORT, () => console.log(`Server listening on :${PORT}`));