// azul_backend/server.js

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const STONE_TYPES = {
  SPACE: "SPACE",
  MIND: "MIND",
  REALITY: "REALITY",
  POWER: "POWER",
  TIME: "TIME",
};
const FACTORY_COUNT = { 2: 5, 3: 7, 4: 9 };
const WALL_ORDER = [
  [
    STONE_TYPES.SPACE,
    STONE_TYPES.MIND,
    STONE_TYPES.REALITY,
    STONE_TYPES.POWER,
    STONE_TYPES.TIME,
  ],
  [
    STONE_TYPES.TIME,
    STONE_TYPES.SPACE,
    STONE_TYPES.MIND,
    STONE_TYPES.REALITY,
    STONE_TYPES.POWER,
  ],
  [
    STONE_TYPES.POWER,
    STONE_TYPES.TIME,
    STONE_TYPES.SPACE,
    STONE_TYPES.MIND,
    STONE_TYPES.REALITY,
  ],
  [
    STONE_TYPES.REALITY,
    STONE_TYPES.POWER,
    STONE_TYPES.TIME,
    STONE_TYPES.SPACE,
    STONE_TYPES.MIND,
  ],
  [
    STONE_TYPES.MIND,
    STONE_TYPES.REALITY,
    STONE_TYPES.POWER,
    STONE_TYPES.TIME,
    STONE_TYPES.SPACE,
  ],
];

const createEmptyPlayer = (id) => ({
  id,
  patternLines: Array(5)
    .fill(null)
    .map((_, i) => Array(i + 1).fill(null)),
  wall: Array(5)
    .fill(null)
    .map(() => Array(5).fill(null)),
  floorLine: [],
  score: 0,
});

const calculatePoints = (wall, row, col) => {
  let hScore = 0,
    vScore = 0;
  for (let i = col + 1; i < 5 && wall[row][i]; i++) hScore++;
  for (let i = col - 1; i >= 0 && wall[row][i]; i--) hScore++;
  for (let i = row + 1; i < 5 && wall[i][col]; i++) vScore++;
  for (let i = row - 1; i >= 0 && wall[i][col]; i--) vScore++;
  let total = 1;
  if (hScore > 0) total += hScore;
  if (vScore > 0) total += vScore;
  return total;
};

const rooms = {};

// Initialise un salon vide en mode LOBBY
function createNewRoom(roomId, roomSize = 4) {
  return {
    maxPlayers: roomSize,
    playerSlots: Array(roomSize).fill(null),
    gameState: {
      factories: [],
      center: [],
      players: [],
      currentPlayerId: 1,
      nextFirstPlayerId: 1,
      heldStones: null,
      firstStonePicked: false,
      gameState: "LOBBY", // 👈 Démarre en attente
      bag: [],
      discard: [],
      playerCount: 0,
      roomSize,
      hostPlayerId: null,
    },
  };
}

// Remplit le sac et distribue les tuiles uniquement au lancement réel
function startRoomGame(room) {
  let initialBag = [];
  Object.values(STONE_TYPES).forEach((type) => {
    for (let i = 0; i < 20; i++) initialBag.push(type);
  });

  initialBag.sort(() => Math.random() - 0.5);

  const initialFactories = [];
  const numFactories = FACTORY_COUNT[room.maxPlayers];
  for (let i = 0; i < numFactories; i++) {
    initialFactories.push(initialBag.splice(0, 4));
  }

  room.gameState.factories = initialFactories;
  room.gameState.players = Array.from({ length: room.maxPlayers }, (_, index) =>
    createEmptyPlayer(index + 1),
  );
  room.gameState.bag = initialBag;
  room.gameState.gameState = "PLAYING"; // 👈 C'est parti !
  room.gameState.currentPlayerId = 1;
}

io.on("connection", (socket) => {
  console.log("🟢 Connexion socket :", socket.id);

  socket.on("join_room", ({ roomId, roomSize }) => {
    const requestedSize = Number(roomSize);
    const normalizedSize = [2, 3, 4].includes(requestedSize)
      ? requestedSize
      : 4;

    if (!rooms[roomId]) {
      rooms[roomId] = createNewRoom(roomId, normalizedSize);
    }

    const room = rooms[roomId];

    if (room.maxPlayers && requestedSize && requestedSize !== room.maxPlayers) {
      // Ignore the requested size if the room already exists
      roomSize = room.maxPlayers;
    }

    room.playerSlots = room.playerSlots || Array(room.maxPlayers).fill(null);
    room.playerSlots.forEach((socketId, index) => {
      if (socketId && !io.sockets.sockets.get(socketId)) {
        room.playerSlots[index] = null;
      }
    });

    let assignedPlayerId = null;
    const existingIndex = room.playerSlots.findIndex(
      (socketId) => socketId === socket.id,
    );
    if (existingIndex !== -1) {
      assignedPlayerId = existingIndex + 1;
    } else {
      const freeIndex = room.playerSlots.findIndex(
        (socketId) => socketId === null,
      );
      if (freeIndex !== -1) {
        room.playerSlots[freeIndex] = socket.id;
        assignedPlayerId = freeIndex + 1;
      }
    }

    if (!assignedPlayerId) {
      socket.emit("room_full");
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerId = assignedPlayerId;

    room.gameState.playerCount = room.playerSlots.filter(Boolean).length;
    room.gameState.roomSize = room.maxPlayers;
    if (!room.gameState.hostPlayerId) {
      room.gameState.hostPlayerId = assignedPlayerId;
    }

    socket.emit("player_assigned", { playerId: assignedPlayerId });
    io.to(roomId).emit("game_updated", room.gameState);

    console.log(
      `👤 Joueur associé au Salon ${roomId} | ID de jeu : ${assignedPlayerId} (${socket.id})`,
    );
  });

  const isPlayerTurn = (socket) => {
    const room = rooms[socket.roomId];
    return (
      room &&
      room.gameState.gameState === "PLAYING" &&
      room.gameState.currentPlayerId === socket.playerId
    );
  };

  socket.on("player_pick_factory", ({ factoryIndex, stoneType }) => {
    if (!isPlayerTurn(socket)) return;
    const room = rooms[socket.roomId];
    const gs = room.gameState;
    if (gs.heldStones) return;

    const picked = gs.factories[factoryIndex].filter((s) => s === stoneType);
    gs.center.push(
      ...gs.factories[factoryIndex].filter((s) => s !== stoneType),
    );
    gs.factories[factoryIndex] = [];
    gs.heldStones = { type: stoneType, count: picked.length };

    io.to(socket.roomId).emit("game_updated", gs);
  });

  socket.on("player_pick_center", ({ stoneType }) => {
    if (!isPlayerTurn(socket)) return;
    const room = rooms[socket.roomId];
    const gs = room.gameState;
    if (gs.heldStones) return;

    const player = gs.players.find((p) => p.id === gs.currentPlayerId);
    if (!gs.firstStonePicked) {
      if (player.floorLine.length < 7) player.floorLine.push("FIRST_PLAYER");
      gs.firstStonePicked = true;
      gs.nextFirstPlayerId = gs.currentPlayerId;
    }
    const picked = gs.center.filter((s) => s === stoneType);
    gs.center = gs.center.filter((s) => s !== stoneType);
    gs.heldStones = { type: stoneType, count: picked.length };

    io.to(socket.roomId).emit("game_updated", gs);
  });

  socket.on("player_place_stones", ({ lineIndex }) => {
    if (!isPlayerTurn(socket)) return;
    const room = rooms[socket.roomId];
    const gs = room.gameState;
    if (!gs.heldStones) return;

    const player = gs.players.find((p) => p.id === gs.currentPlayerId);
    const { type, count } = gs.heldStones;
    const line = player.patternLines[lineIndex];
    const colInWall = WALL_ORDER[lineIndex].indexOf(type);

    const hasDifferentColor = line.some((s) => s !== null && s !== type);
    const isAlreadyInWall = player.wall[lineIndex][colInWall] !== null;

    let remaining = count;

    if (hasDifferentColor || isAlreadyInWall) {
      while (remaining > 0 && player.floorLine.length < 7) {
        player.floorLine.push(type);
        remaining--;
      }
      if (remaining > 0) gs.discard.push(...Array(remaining).fill(type));
    } else {
      for (let i = line.length - 1; i >= 0 && remaining > 0; i--) {
        if (line[i] === null) {
          line[i] = type;
          remaining--;
        }
      }
      while (remaining > 0 && player.floorLine.length < 7) {
        player.floorLine.push(type);
        remaining--;
      }
      if (remaining > 0) gs.discard.push(...Array(remaining).fill(type));
    }
    gs.heldStones = null;

    if (gs.factories.every((f) => f.length === 0) && gs.center.length === 0) {
      gs.players.forEach((p) => {
        p.patternLines.forEach((l, row) => {
          if (l.every((s) => s !== null)) {
            const stone = l[0];
            const col = WALL_ORDER[row].indexOf(stone);
            p.wall[row][col] = stone;
            p.score += calculatePoints(p.wall, row, col);
            gs.discard.push(...l.slice(1));
            p.patternLines[row] = Array(row + 1).fill(null);
          }
        });

        const penalties = [-1, -1, -2, -2, -2, -3, -3];
        p.floorLine.forEach((item, i) => {
          p.score = Math.max(0, p.score + (penalties[i] || -3));
          if (item !== "FIRST_PLAYER") gs.discard.push(item);
        });
        p.floorLine = [];
      });

      if (
        gs.players.some((p) =>
          p.wall.some((row) => row.every((c) => c !== null)),
        )
      ) {
        gs.players.forEach((p) => {
          p.wall.forEach((row) => {
            if (row.every((c) => c !== null)) p.score += 2;
          });
          for (let c = 0; c < 5; c++) {
            if (p.wall.every((r) => r[c] !== null)) p.score += 7;
          }
          Object.values(STONE_TYPES).forEach((t) => {
            if (p.wall.every((row) => row.includes(t))) p.score += 10;
          });
        });
        gs.gameState = "GAME_OVER";
      } else {
        if (gs.bag.length < FACTORY_COUNT[room.maxPlayers] * 4) {
          gs.bag = [...gs.bag, ...gs.discard].sort(() => Math.random() - 0.5);
          gs.discard = [];
        }

        const nextFactories = [];
        const numFactories = FACTORY_COUNT[room.maxPlayers];
        for (let i = 0; i < numFactories; i++) {
          nextFactories.push(gs.bag.splice(0, 4));
        }
        gs.factories = nextFactories;

        gs.firstStonePicked = false;
        gs.currentPlayerId = gs.nextFirstPlayerId;
      }
    } else {
      gs.currentPlayerId =
        gs.currentPlayerId === room.maxPlayers ? 1 : gs.currentPlayerId + 1;
    }

    io.to(socket.roomId).emit("game_updated", gs);
  });

  socket.on("start_game", () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    if (socket.playerId !== room.gameState.hostPlayerId) return;
    if (room.gameState.roomSize !== room.gameState.playerCount) return;
    if (room.gameState.gameState !== "LOBBY") return;

    startRoomGame(room);
    io.to(socket.roomId).emit("game_updated", room.gameState);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Déconnexion socket :", socket.id);
    if (socket.roomId && rooms[socket.roomId]) {
      const room = rooms[socket.roomId];
      const slotIndex = room.playerSlots.findIndex(
        (socketId) => socketId === socket.id,
      );
      if (slotIndex !== -1) {
        room.playerSlots[slotIndex] = null;
      }

      room.gameState.playerCount = room.playerSlots.filter(Boolean).length;

      if (room.gameState.playerCount === 0) {
        delete rooms[socket.roomId];
        console.log(`🗑️ Salon ${socket.roomId} nettoyé car vide.`);
      } else {
        io.to(socket.roomId).emit("game_updated", room.gameState);
      }
    }
  });
});

server.listen(3002, () => {
  console.log("🚀 Serveur démarré sur le port 3002");
});
