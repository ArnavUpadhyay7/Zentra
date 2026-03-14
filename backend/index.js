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

// { [roomId]: { players: { [socketId]: {username,x,y,charIndex} }, nextCharacterIndex } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("create-room", (data) => {
    const roomId = nanoid(8);
    rooms[roomId] = { players: {}, nextCharacterIndex: 1, mapId: data.mapId || "indoor" };
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
      mapId: rooms[roomId].mapId,
    });

    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username: data.username,
      players: rooms[roomId].players,
      mapId: rooms[roomId].mapId,
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
      username,
      x: 256,
      y: 160,
      charIndex: rooms[roomId].nextCharacterIndex++,
    };

    console.log(`Player ${username} joined room ${roomId}`);
    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username,
      players: rooms[roomId].players,
      mapId: rooms[roomId].mapId,
    });
  });

  socket.on("player-move", ({ roomId, x, y, direction, flipX }) => {
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].x = x;
      rooms[roomId].players[socket.id].y = y;
    }
    socket
      .to(roomId)
      .emit("player-moved", { id: socket.id, x, y, direction, flipX });
  });

  socket.on("get-room-state", ({ roomId }) => {
    if (!rooms[roomId]) return;
    socket.emit("room-state", { players: rooms[roomId].players });
  });

  socket.on("chat-message", ({ roomId, username, text }) => {
    if (!rooms[roomId]) return;
    if (!text?.trim()) return;

    socket.to(roomId).emit("chat-message", {
      username,
      text: text.trim().slice(0, 300),
      ts: Date.now(),
    });
  });

  // proximity check
  // if distance < proximity range -> emit "player-nearby"
  // distance = Math.sqrt((x2 - x1)^2 + (y2 - y1)^2)

  const proximityState = {};
  // { socketId: Set(playerIdsNearby) }

  socket.on("check-proximity", () => {
    const roomId = Object.keys(rooms).find(
      (id) => rooms[id].players[socket.id],
    );
    if (!roomId) return;

    const player = rooms[roomId].players[socket.id];
    const proximityRange = 50;

    if (!proximityState[socket.id]) {
      proximityState[socket.id] = new Set();
    }

    const currentNearby = new Set();

    for (const [id, otherPlayer] of Object.entries(rooms[roomId].players)) {
      if (id === socket.id) continue;

      const dx = otherPlayer.x - player.x;
      const dy = otherPlayer.y - player.y;

      if (dx * dx + dy * dy < proximityRange * proximityRange) {
        currentNearby.add(id);

        // player ENTERED range
        if (!proximityState[socket.id].has(id)) {
          socket.emit("nearby-user", otherPlayer);
          console.log(`Player entered proximity: ${otherPlayer.username}`);
        }
      }
    }

    // detect players who LEFT range
    for (const id of proximityState[socket.id]) {
      if (!currentNearby.has(id)) {
        socket.emit("nearby-left", { id });
        console.log(`Player left proximity`);
      }
    }

    proximityState[socket.id] = currentNearby;
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
          // delete proximity state - change
          delete proximityState[socket.id];
          console.log(`Room ${roomId} deleted — empty`);
        }
        break;
      }
    }
  });
});

const PORT = 4001;
server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
