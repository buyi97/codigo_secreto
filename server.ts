import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { WORDS_ES } from "./src/lib/words";
import { generateBoard, DEFAULT_CONFIG } from "./src/lib/gameLogic";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    // Importante: FRONTEND_URL en Render debe ser la URL de Vercel SIN la barra "/" final
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const games: Record<string, any> = {};

function generateRoomId(): string {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games[id]);
  return id;
}

io.on("connection", (socket) => {
  console.log("Agente conectado:", socket.id);

  socket.on("createRoom", ({ playerName, password, isPublic }) => {
    const roomId = generateRoomId();
    games[roomId] = {
      roomId,
      cards: generateBoard(WORDS_ES),
      players: [{ id: socket.id, name: playerName, team: "red", role: "operative" }],
      turn: "red",
      status: "lobby",
      config: { ...DEFAULT_CONFIG }
    };
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("gameStateUpdate", games[roomId]);
  });

  socket.on("joinRoom", ({ roomId, playerName }) => {
    if (games[roomId]) {
      const exists = games[roomId].players.find((p: any) => p.id === socket.id);
      if (!exists) {
        games[roomId].players.push({ id: socket.id, name: playerName, team: "blue", role: "operative" });
      }
      socket.join(roomId);
      io.to(roomId).emit("gameStateUpdate", games[roomId]);
    } else {
      socket.emit("error", "La misión no existe.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Agente desconectado");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});