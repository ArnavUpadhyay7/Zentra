const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "https://zentra-space.vercel.app"];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

// { [roomId]: { players: { [socketId]: {username,x,y,charIndex} }, nextCharacterIndex, mapId } }
const rooms = {};

const proximityState = {};
const lockedPair     = {};

// ── Spawn positions per charIndex (1-6) per map ───────────────────────────────
// Spread 80px+ apart so no two players start within proximity range (50px).
// charIndex is 1-based so index into array with charIndex-1.
const SPAWNS = {
  indoor: [
    { x: 416, y: 240 },  // charIndex 1 — centre hall
    { x: 316, y: 240 },  // charIndex 2 — left
    { x: 516, y: 240 },  // charIndex 3 — right
    { x: 416, y: 160 },  // charIndex 4 — upper centre
    { x: 316, y: 320 },  // charIndex 5 — lower left
    { x: 516, y: 320 },  // charIndex 6 — lower right
  ],
  "tiny-dungeon": [
    { x: 416, y: 320 },  // charIndex 1 — centre plaza
    { x: 316, y: 320 },  // charIndex 2 — left
    { x: 516, y: 320 },  // charIndex 3 — right
    { x: 416, y: 220 },  // charIndex 4 — upper centre
    { x: 316, y: 420 },  // charIndex 5 — lower left
    { x: 516, y: 420 },  // charIndex 6 — lower right
  ],
};

function getSpawn(mapId, charIndex) {
  const list = SPAWNS[mapId] || SPAWNS["indoor"];
  return list[(charIndex - 1) % list.length];
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // ── Create room ───────────────────────────────────────────────────────────
  socket.on("create-room", (data) => {
    const roomId = nanoid(8);
    const mapId  = data.mapId || "indoor";
    rooms[roomId] = { players: {}, nextCharacterIndex: 1, mapId };
    socket.join(roomId);

    const charIndex = rooms[roomId].nextCharacterIndex++;
    const spawn     = getSpawn(mapId, charIndex);

    rooms[roomId].players[socket.id] = {
      username: data.username,
      x: spawn.x, y: spawn.y,
      charIndex,
    };

    console.log(`Room ${roomId} created by ${data.username} (map: ${mapId})`);

    socket.emit("room-created", {
      roomId,
      charIndex,
      mapId,
    });

    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username: data.username,
      players: rooms[roomId].players,
      mapId,
    });
  });

  // ── Join room ─────────────────────────────────────────────────────────────
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

    const mapId     = rooms[roomId].mapId;
    const charIndex = rooms[roomId].nextCharacterIndex++;
    const spawn     = getSpawn(mapId, charIndex);

    rooms[roomId].players[socket.id] = {
      username,
      x: spawn.x, y: spawn.y,
      charIndex,
    };

    console.log(`Player ${username} joined room ${roomId} (charIndex: ${charIndex})`);

    // Tell the joiner their charIndex + mapId directly so Landing.jsx
    // can navigate with full state (character + map) before Phaser boots.
    socket.emit("join-success", { charIndex, mapId, roomId });

    io.to(roomId).emit("player-joined", {
      id: socket.id,
      username,
      players: rooms[roomId].players,
      mapId,
    });
  });

  // ── Player move ───────────────────────────────────────────────────────────
  socket.on("player-move", ({ roomId, x, y, direction, flipX }) => {
    if (rooms[roomId]?.players[socket.id]) {
      rooms[roomId].players[socket.id].x = x;
      rooms[roomId].players[socket.id].y = y;
    }
    socket.to(roomId).emit("player-moved", { id: socket.id, x, y, direction, flipX });
  });

  // ── Get room state ────────────────────────────────────────────────────────
  socket.on("get-room-state", ({ roomId }) => {
    if (!rooms[roomId]) return;
    socket.emit("room-state", { players: rooms[roomId].players });
  });

  // ── Group chat ────────────────────────────────────────────────────────────
  socket.on("chat-message", ({ roomId, username, text }) => {
    if (!rooms[roomId]) return;
    if (!text?.trim()) return;
    socket.to(roomId).emit("chat-message", {
      username,
      text: text.trim().slice(0, 300),
      ts: Date.now(),
    });
  });

  // ── Nearby (private) chat ─────────────────────────────────────────────────
  socket.on("nearby-message", ({ username, text }) => {
    if (!text?.trim()) return;
    const partnerId = lockedPair[socket.id];
    if (!partnerId) return;
    io.to(partnerId).emit("nearby-message", {
      username,
      text: text.trim().slice(0, 300),
      ts: Date.now(),
    });
  });

  // ── Proximity check ───────────────────────────────────────────────────────
  socket.on("check-proximity", () => {
    const roomId = Object.keys(rooms).find((id) => rooms[id]?.players[socket.id]);
    if (!roomId) return;

    const mover = rooms[roomId].players[socket.id];
    const RANGE = 50;

    if (!proximityState[socket.id]) proximityState[socket.id] = new Set();

    const currentNearby = new Set();

    for (const [otherId, other] of Object.entries(rooms[roomId].players)) {
      if (otherId === socket.id) continue;

      const dx = other.x - mover.x;
      const dy = other.y - mover.y;

      if (dx * dx + dy * dy < RANGE * RANGE) {
        currentNearby.add(otherId);

        if (!proximityState[socket.id].has(otherId)) {
          const moverLock = lockedPair[socket.id];
          if (!moverLock || moverLock === otherId) {
            socket.emit("nearby-user", other);
            lockedPair[socket.id] = otherId;
          }

          if (!proximityState[otherId]) proximityState[otherId] = new Set();
          proximityState[otherId].add(socket.id);

          const otherLock = lockedPair[otherId];
          if (!otherLock || otherLock === socket.id) {
            io.to(otherId).emit("nearby-user", mover);
            lockedPair[otherId] = socket.id;
          }

          console.log(`${mover.username} <-> ${other.username} in proximity`);
        }
      }
    }

    for (const otherId of proximityState[socket.id]) {
      if (!currentNearby.has(otherId)) {
        if (proximityState[otherId]) proximityState[otherId].delete(socket.id);

        if (lockedPair[socket.id] === otherId) {
          socket.emit("nearby-left", { id: otherId });
          delete lockedPair[socket.id];
        }

        if (lockedPair[otherId] === socket.id) {
          io.to(otherId).emit("nearby-left", { id: socket.id });
          delete lockedPair[otherId];
        }
      }
    }

    proximityState[socket.id] = currentNearby;
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    delete proximityState[socket.id];
    for (const [sid, pid] of Object.entries(lockedPair)) {
      if (pid === socket.id) {
        io.to(sid).emit("nearby-left", { id: socket.id });
        delete lockedPair[sid];
      }
    }
    delete lockedPair[socket.id];

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

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server listening on :${PORT}`));