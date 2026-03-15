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

// ── Proximity state (OUTSIDE connection handler so all sockets share it) ──────
// proximityState[id] = Set of socket IDs currently in range of that player
// lockedPair[id]     = socket ID of active chat partner
//   Lock is set when two players enter range. It only breaks when the locked
//   partner actually moves OUT of range — a third player entering doesn't replace.
const proximityState = {};
const lockedPair     = {};

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // ── Create room ───────────────────────────────────────────────────────────
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
  // Routed only to the locked partner. Dropped if no lock exists.
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
  // Called by the MOVING player on every position change.
  // Notifies BOTH the mover AND the stationary player so neither is blind.
  //
  // Lock semantics:
  //   - When A enters B's range: both get locked to each other
  //   - Third player C entering is ignored while the lock holds
  //   - Lock breaks only when the locked partner moves OUT of range
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

        // Just entered range
        if (!proximityState[socket.id].has(otherId)) {
          // Notify mover — only if unlocked or this IS their locked partner
          const moverLock = lockedPair[socket.id];
          if (!moverLock || moverLock === otherId) {
            socket.emit("nearby-user", other);
            lockedPair[socket.id] = otherId;
          }

          // Notify other player — only if unlocked or mover IS their locked partner
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

    // Players who left range
    for (const otherId of proximityState[socket.id]) {
      if (!currentNearby.has(otherId)) {
        if (proximityState[otherId]) proximityState[otherId].delete(socket.id);

        // Break mover's lock if this was their partner
        if (lockedPair[socket.id] === otherId) {
          socket.emit("nearby-left", { id: otherId });
          delete lockedPair[socket.id];
        }

        // Break other's lock if mover was their partner
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
    // Clean up proximity
    delete proximityState[socket.id];
    for (const [sid, pid] of Object.entries(lockedPair)) {
      if (pid === socket.id) {
        io.to(sid).emit("nearby-left", { id: socket.id });
        delete lockedPair[sid];
      }
    }
    delete lockedPair[socket.id];

    // Remove from room
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