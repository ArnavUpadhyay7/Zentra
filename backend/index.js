require("dotenv").config();   // must be first — loads .env before anything reads process.env

const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const { nanoid } = require("nanoid");
const cors    = require("cors");
const { AccessToken } = require("livekit-server-sdk");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "https://zentra-space.vercel.app"];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

// ── LiveKit token endpoint ────────────────────────────────────────────────────
// Frontend calls this when an interaction starts to get a room-scoped token.
app.get("/livekit-token", async (req, res) => {
  const { roomId, userId } = req.query;

  if (!roomId || !userId) {
    return res.status(400).json({ error: "roomId and userId are required" });
  }

  const apiKey    = process.env.API_KEY;
  const apiSecret = process.env.API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit credentials not configured" });
  }

  const token = new AccessToken(apiKey, apiSecret, { identity: userId });
  token.addGrant({
    roomJoin:     true,
    room:         roomId,
    canPublish:   true,
    canSubscribe: true,
  });

  const jwt = await token.toJwt();
  console.log("[LiveKit] token generated for", userId, "in room", roomId);
  res.json({ token: jwt });
});

const rooms = {};

// socketId → socketId  (proximity pair — who I'm currently near)
const lockedPair = {};

// socketId → socketId  (active accepted interaction)
const activeInteractions = new Map();

function getRoomIdForSocket(socketId) {
  return Object.keys(rooms).find((id) => rooms[id]?.players[socketId]);
}

function getUsername(socketId) {
  const roomId = getRoomIdForSocket(socketId);
  return roomId ? (rooms[roomId].players[socketId]?.username ?? null) : null;
}

function clearInteraction(a, b) {
  activeInteractions.delete(a);
  activeInteractions.delete(b);
  delete lockedPair[a];
  delete lockedPair[b];

  const roomIdA  = getRoomIdForSocket(a);
  const players  = roomIdA ? rooms[roomIdA]?.players : null;
  const playerA  = players?.[a];
  const playerB  = players?.[b];
  const nameA    = playerA?.username ?? null;
  const nameB    = playerB?.username ?? null;

  io.to(a).emit("interaction-ended", { byPlayerId: a, otherUsername: nameB });
  io.to(b).emit("interaction-ended", { byPlayerId: a, otherUsername: nameA });
  io.to(a).emit("nearby-left", { id: b });
  io.to(b).emit("nearby-left", { id: a });

  if (playerA && playerB) {
    const ENTER_RANGE = 80;
    const dx = playerA.x - playerB.x;
    const dy = playerA.y - playerB.y;
    if (dx * dx + dy * dy < ENTER_RANGE * ENTER_RANGE) {
      lockedPair[a] = b;
      lockedPair[b] = a;
      setTimeout(() => {
        io.to(a).emit("nearby-user", { ...playerB, socketId: b });
        io.to(b).emit("nearby-user", { ...playerA, socketId: a });
        console.log(`[clearInteraction] re-paired ${nameA} <-> ${nameB} (still in range)`);
      }, 100);
    }
  }

  console.log(`[clearInteraction] ended ${nameA} <-> ${nameB}`);
}

const SPAWNS = {
  indoor: [
    { x: 416, y: 240 }, { x: 316, y: 240 }, { x: 516, y: 240 },
    { x: 416, y: 160 }, { x: 316, y: 320 }, { x: 516, y: 320 },
  ],
  "tiny-dungeon": [
    { x: 416, y: 320 }, { x: 316, y: 320 }, { x: 516, y: 320 },
    { x: 416, y: 220 }, { x: 316, y: 420 }, { x: 516, y: 420 },
  ],
};

function getSpawn(mapId, charIndex) {
  const list = SPAWNS[mapId] || SPAWNS["indoor"];
  return list[(charIndex - 1) % list.length];
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on("create-room", (data) => {
    const roomId = nanoid(8);
    const mapId  = data.mapId || "indoor";
    rooms[roomId] = { players: {}, nextCharacterIndex: 1, mapId };
    socket.join(roomId);
    const charIndex = rooms[roomId].nextCharacterIndex++;
    const spawn     = getSpawn(mapId, charIndex);
    rooms[roomId].players[socket.id] = { username: data.username, x: spawn.x, y: spawn.y, charIndex };
    console.log(`Room ${roomId} created by ${data.username}`);
    socket.emit("room-created", { roomId, charIndex, mapId });
    io.to(roomId).emit("player-joined", { id: socket.id, username: data.username, players: rooms[roomId].players, mapId });
  });

  socket.on("join-room", ({ roomId, username }) => {
    if (!rooms[roomId]) { socket.emit("join-error", { message: "Room does not exist" }); return; }
    if (rooms[roomId].players[socket.id]) return;
    if (Object.keys(rooms[roomId].players).length >= 6) { socket.emit("join-error", { message: "Room is full" }); return; }
    socket.join(roomId);
    const mapId     = rooms[roomId].mapId;
    const charIndex = rooms[roomId].nextCharacterIndex++;
    const spawn     = getSpawn(mapId, charIndex);
    rooms[roomId].players[socket.id] = { username, x: spawn.x, y: spawn.y, charIndex };
    console.log(`${username} joined room ${roomId}`);
    socket.emit("join-success", { charIndex, mapId, roomId });
    io.to(roomId).emit("player-joined", { id: socket.id, username, players: rooms[roomId].players, mapId });
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
    if (!rooms[roomId] || !text?.trim()) return;
    socket.to(roomId).emit("chat-message", { username, text: text.trim().slice(0, 300), ts: Date.now() });
  });

  socket.on("nearby-message", ({ username, text }) => {
    if (!text?.trim()) return;
    const partnerId = lockedPair[socket.id];
    if (!partnerId) return;
    io.to(partnerId).emit("nearby-message", { username, text: text.trim().slice(0, 300), ts: Date.now() });
  });

  socket.on("check-proximity", () => {
    const roomId = getRoomIdForSocket(socket.id);
    if (!roomId) return;
    const players = rooms[roomId].players;
    const me      = players[socket.id];
    if (!me) return;

    const ENTER_RANGE = 80;
    const LEAVE_RANGE = 100;

    const nowNear = new Set();
    for (const [otherId, other] of Object.entries(players)) {
      if (otherId === socket.id) continue;
      const dx = other.x - me.x, dy = other.y - me.y;
      if (dx * dx + dy * dy < ENTER_RANGE * ENTER_RANGE) nowNear.add(otherId);
    }

    for (const otherId of nowNear) {
      if (lockedPair[socket.id] === otherId && lockedPair[otherId] === socket.id) continue;
      const myLock    = lockedPair[socket.id];
      const theirLock = lockedPair[otherId];
      if (myLock && myLock !== otherId) continue;
      if (theirLock && theirLock !== socket.id) continue;
      const other = players[otherId];
      if (!lockedPair[socket.id]) {
        socket.emit("nearby-user", { ...other, socketId: otherId });
        lockedPair[socket.id] = otherId;
      }
      if (!lockedPair[otherId]) {
        io.to(otherId).emit("nearby-user", { ...me, socketId: socket.id });
        lockedPair[otherId] = socket.id;
      }
      console.log(`[proximity] entered: ${me.username} <-> ${other.username}`);
    }

    const myPartner = lockedPair[socket.id];
    if (myPartner && !nowNear.has(myPartner)) {
      const other = players[myPartner];
      const gone  = !other || (() => {
        const dx = other.x - me.x, dy = other.y - me.y;
        return dx * dx + dy * dy >= LEAVE_RANGE * LEAVE_RANGE;
      })();

      if (gone) {
        console.log(`[proximity] exited: ${me.username} left ${other?.username ?? myPartner}`);
        if (activeInteractions.get(socket.id) === myPartner) {
          clearInteraction(socket.id, myPartner);
        } else {
          socket.emit("nearby-left", { id: myPartner });
          io.to(myPartner).emit("nearby-left", { id: socket.id });
          delete lockedPair[socket.id];
          delete lockedPair[myPartner];
        }
      }
    }
  });

  socket.on("interaction-request", ({ toPlayerId }) => {
    const fromId = socket.id;
    const toId   = toPlayerId;
    console.log("[interaction-request]", { from: fromId, to: toId });
    if (!toId || !io.sockets.sockets.has(toId)) {
      console.log("[interaction-request] REJECTED — target not found"); return;
    }
    if (activeInteractions.has(fromId)) {
      console.log("[interaction-request] REJECTED — sender already interacting"); return;
    }
    if (activeInteractions.has(toId)) {
      console.log("[interaction-request] REJECTED — receiver already interacting"); return;
    }
    const fromUsername = getUsername(fromId) ?? "Someone";
    io.to(toId).emit("interaction-request-received", { fromPlayerId: fromId, username: fromUsername });
    socket.emit("interaction-request-sent");
    console.log(`[interaction-request] ${fromUsername} → ${toId}`);
  });

  socket.on("interaction-accepted", ({ fromPlayerId, toPlayerId }) => {
    const playerA = fromPlayerId;
    const playerB = toPlayerId || socket.id;
    const roomId  = getRoomIdForSocket(playerA);
    if (!roomId || getRoomIdForSocket(playerB) !== roomId) {
      console.log("[interaction-accepted] REJECTED — room mismatch"); return;
    }
    if (activeInteractions.has(playerA)) {
      const stale = activeInteractions.get(playerA);
      activeInteractions.delete(playerA); activeInteractions.delete(stale);
    }
    if (activeInteractions.has(playerB)) {
      const stale = activeInteractions.get(playerB);
      activeInteractions.delete(playerB); activeInteractions.delete(stale);
    }
    activeInteractions.set(playerA, playerB);
    activeInteractions.set(playerB, playerA);
    const usernameA = rooms[roomId].players[playerA]?.username;
    const usernameB = rooms[roomId].players[playerB]?.username;
    console.log(`[interaction-started] ${usernameA} <-> ${usernameB}`);
    io.to(playerA).emit("interaction-started", { playerA, playerB, usernameA, usernameB, otherUsername: usernameB });
    io.to(playerB).emit("interaction-started", { playerA, playerB, usernameA, usernameB, otherUsername: usernameA });
  });

  socket.on("interaction-declined", ({ fromPlayerId, toPlayerId }) => {
    const declinedBy = toPlayerId || socket.id;
    const notifyId   = fromPlayerId;
    const uname = getUsername(declinedBy);
    console.log(`[interaction-declined] ${uname} declined ${notifyId}`);
    io.to(notifyId).emit("interaction-declined", { fromPlayerId: declinedBy, username: uname });
  });

  socket.on("interaction-ended", ({ toPlayerId } = {}) => {
    const partner = toPlayerId || activeInteractions.get(socket.id);
    if (!partner) return;
    clearInteraction(socket.id, partner);
  });

  socket.on("interaction-cancelled", ({ toPlayerId }) => {
    if (toPlayerId) io.to(toPlayerId).emit("interaction-cancelled");
  });

  socket.on("private-message", ({ roomId: rid, toUsername, text, from }) => {
    if (!text?.trim()) return;
    const targetId = Object.entries(rooms[rid]?.players || {})
      .find(([, p]) => p.username === toUsername)?.[0];
    if (targetId) io.to(targetId).emit("private-message", { from, text: text.trim().slice(0, 300), ts: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected:", socket.id);
    if (activeInteractions.has(socket.id)) {
      const partner = activeInteractions.get(socket.id);
      clearInteraction(socket.id, partner);
    } else {
      const partner = lockedPair[socket.id];
      if (partner) {
        io.to(partner).emit("nearby-left", { id: socket.id });
        delete lockedPair[partner];
      }
      delete lockedPair[socket.id];
    }
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        const { username } = room.players[socket.id];
        delete room.players[socket.id];
        console.log(`${username} left room ${roomId}`);
        io.to(roomId).emit("player-left", { id: socket.id, username });
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted`);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server on :${PORT}`));