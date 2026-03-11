const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173" },
});

// Structure: { [roomId]: { players: { [socketId]: { username, x, y } } } }

const rooms = {};

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("create-room", (data) => {
    const roomId = nanoid(8);
    rooms[roomId] = {
      players: {},
      nextCharacterIndex: 1,
    };
    socket.join(roomId);
    rooms[roomId].players[socket.id] = {
      username: data.username,
      x: 256,
      y: 160,
      charIndex: rooms[roomId].nextCharacterIndex++,
    };

    console.log(`Room ${roomId} created by ${data.username}`);
    socket.emit("room-created", {
      roomId,
      charIndex: rooms[roomId].players[socket.id].charIndex,
    });

    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username: data.username,
      players: rooms[roomId].players,
    });
  });

  socket.on("join-room", (data) => {
    const { roomId, username } = data;
    if (!rooms[roomId]) {
      socket.emit("join-error", { message: "Room does not exist" });
      return;
    }
    if (rooms[roomId].players[socket.id]) {
      return;
    }

    const playerCount = Object.keys(rooms[roomId].players).length;
    if (playerCount >= 6) {
      socket.emit("join-error", { message: "Room is full" });
      return;
    }

    socket.join(roomId);
    rooms[roomId].players[socket.id] = {
      username: username,
      x: 256,
      y: 160,
      charIndex: rooms[roomId].nextCharacterIndex++,
    };

    console.log(`Player ${username} joined room ${roomId}`);
    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username: username,
      players: rooms[roomId].players,
    });
  });

  socket.on("player-move", (data) => {
    const { roomId, x, y, direction, flipX } = data;

    // Update server-side position
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].x = x;
      rooms[roomId].players[socket.id].y = y;
    }

    // Broadcast to everyone else in the room
    socket.to(roomId).emit("player-moved", {
      id: socket.id,
      x,
      y,
      direction,
      flipX,
    });
  });

  socket.on("get-room-state", ({ roomId }) => {
    if (!rooms[roomId]) return;
    socket.emit("room-state", { players: rooms[roomId].players });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];

      if (room.players[socket.id]) {
        const { username } = room.players[socket.id];

        delete room.players[socket.id];
        console.log(`${username} left room ${roomId}`);

        io.to(roomId).emit("player-left", {
          id: socket.id,
          username: username,
        });

        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted — no players left`);
        }

        break;
      }
    }
  });
});

const PORT = 4001;
server.listen(PORT, () => console.log(`server is listening on port: ${PORT}`));
