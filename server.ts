import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WORDS_ES, WORDS_EN } from "./src/lib/words";
import { generateBoard, GameState, Player, Card, DEFAULT_CONFIG, PlayerTeam, Team } from "./src/lib/gameLogic";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // Aquí permitimos que tu URL de Vercel se conecte. 
    // En desarrollo usará localhost:5173
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// In-memory store for game states
const games: Record<string, GameState> = {};

function generateRoomId(): string {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (games[id]);
  return id;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", ({ playerName, password, isPublic }) => {
    const roomId = generateRoomId();
    games[roomId] = {
      roomId,
      cards: generateBoard(WORDS_ES),
      players: [{ id: socket.id, name: playerName, team: "red", role: "operative" }],
      turn: "red",
      status: "lobby",
      config: { ...DEFAULT_CONFIG },
      currentClue: null,
      guessesMade: 0,
      timer: DEFAULT_CONFIG.timerDuration,
      isFirstTurn: true,
      isUltimatum: false,
      history: { red: 0, blue: 0 } // Inicializamos historial
    };
    
    socket.emit("roomCreated", roomId);
  });

  socket.on("joinRoom", ({ roomId, playerName, password }) => {
    const game = games[roomId];
    if (!game) {
      socket.emit("error", "La sala no existe.");
      return;
    }

    if (!game.config.isPublic && game.config.password && game.config.password !== password) {
      socket.emit("error", "Contraseña incorrecta.");
      return;
    }

    if (game.players.length >= game.config.maxPlayers) {
      socket.emit("error", `La sala está llena (máx ${game.config.maxPlayers} jugadores).`);
      return;
    }

    socket.join(roomId);
    
    const isHost = game.players.length === 0;
    
    // Assign random balanced team
    let team: PlayerTeam = "spectator";
    if (game.status === "lobby") {
      const redCount = game.players.filter(p => p.team === "red").length;
      const blueCount = game.players.filter(p => p.team === "blue").length;
      team = redCount <= blueCount ? "red" : "blue";
    }

    const newPlayer: Player = {
      id: socket.id,
      name: playerName || `Agente ${game.players.length + 1}`,
      team,
      role: "operative",
      isHost,
    };

    game.players.push(newPlayer);
    io.to(roomId).emit("gameStateUpdate", game);
  });

  socket.on("updateConfig", ({ roomId, config }) => {
    const game = games[roomId];
    if (game && game.status !== "playing") {
      const player = game.players.find(p => p.id === socket.id);
      if (player?.isHost) {
        game.config = { ...game.config, ...config };
        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("startGame", (roomId) => {
    const game = games[roomId];
    if (game) {
      const player = game.players.find(p => p.id === socket.id);
      if (!player?.isHost) return;

      // Check for Spymasters if more than 1 player
      if (game.players.length > 1) {
        const redSpymaster = game.players.find(p => p.team === "red" && p.role === "spymaster");
        const blueSpymaster = game.players.find(p => p.team === "blue" && p.role === "spymaster");
        if (!redSpymaster || !blueSpymaster) {
          socket.emit("error", "Cada equipo debe tener un Líder (Spymaster) asignado.");
          return;
        }
      } else if (game.players.length === 1) {
        // Single player mode: assign all roles to the single player
        const p = game.players[0];
        p.role = "spymaster"; // They act as spymaster for both (conceptually)
      }

      const firstTeam = Math.random() > 0.5 ? "red" : "blue";
      
      // Word bank logic
      let wordPool = game.config.language === "es" ? WORDS_ES : WORDS_EN;
      if (game.config.wordBankMode === "replace") {
        if (game.config.customWords.length >= 25) {
          wordPool = game.config.customWords;
        }
      } else {
        wordPool = [...wordPool, ...game.config.customWords];
      }
      
      game.cards = generateBoard(wordPool, firstTeam);
      game.totalRed = game.cards.filter(c => c.team === "red").length;
      game.totalBlue = game.cards.filter(c => c.team === "blue").length;
      game.turn = firstTeam;
      game.status = "playing";
      game.winner = null;
      game.clues = [];
      game.isFirstTurn = true;
      game.isUltimatum = false;
      game.currentClue = null;
      game.guessesMade = 0;
      
      // Initial timer
      if (game.config.firstTurnMode === "unlimited") {
        game.timer = -1; // Special value for unlimited
      } else if (game.config.firstTurnMode === "custom") {
        game.timer = game.config.firstTurnDuration;
      } else {
        game.timer = game.config.timerDuration;
      }

      io.to(roomId).emit("gameStateUpdate", game);
    }
  });

  socket.on("terminateGame", (roomId) => {
    const game = games[roomId];
    if (game) {
      const player = game.players.find(p => p.id === socket.id);
      if (player?.isHost) {
        game.status = "lobby";
        game.cards = [];
        game.clues = [];
        game.currentClue = null;
        game.winner = null;
        game.isFirstTurn = true;
        game.isUltimatum = false;
        game.guessesMade = 0;
        game.timer = game.config.timerDuration;
        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("movePlayer", ({ roomId, playerId, team, role }) => {
    const game = games[roomId];
    if (game && game.status !== "playing") {
      const currentPlayer = game.players.find(p => p.id === socket.id);
      if (currentPlayer?.isHost) {
        const targetPlayer = game.players.find(p => p.id === playerId);
        if (targetPlayer) {
          if (team) targetPlayer.team = team;
          if (role) targetPlayer.role = role;
          io.to(roomId).emit("gameStateUpdate", game);
        }
      }
    }
  });

  socket.on("selectTeam", ({ roomId, team }) => {
    const game = games[roomId];
    if (game && game.status !== "playing") {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        player.team = team;
        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("selectRole", ({ roomId, role }) => {
    const game = games[roomId];
    if (game && game.status !== "playing") {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        player.role = role;
        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("clickCard", ({ roomId, cardId }) => {
    const game = games[roomId];
    if (game && game.status === "playing") {
      const card = game.cards.find((c) => c.id === cardId);
      const player = game.players.find((p) => p.id === socket.id);
      
      // In single player mode, allow clicking regardless of team/role
      const isSinglePlayer = game.players.length === 1;
      const canClick = isSinglePlayer || (player && player.team === game.turn && player.role === "operative");

      if (card && !card.revealed && canClick && game.currentClue) {
        // Check guess limit
        if (game.config.limitGuesses && game.currentClue.count > 0) {
          if (game.guessesMade > game.currentClue.count) {
            return; // Limit reached (n+1 allowed)
          }
        }

        card.revealed = true;
        game.guessesMade++;
        
        let turnEnded = false;

        if (card.team === "assassin") {
          game.status = "ended";
          game.winner = game.turn === "red" ? "blue" : "red";
          game.history[game.winner]++;
        } else if (card.team === "neutral") {
          turnEnded = true;
        } else if (card.team !== game.turn) {
          turnEnded = true;
        } else {
          // Correct word - add 10 seconds bonus
          if (game.timer !== -1) {
            game.timer += 10;
          }
          // Check if limit reached after correct guess
          if (game.config.limitGuesses && game.currentClue.count > 0 && game.guessesMade > game.currentClue.count) {
            turnEnded = true;
          }
        }

        if (turnEnded) {
          game.turn = game.turn === "red" ? "blue" : "red";
          game.timer = game.config.timerDuration;
          game.isFirstTurn = false;
          game.isUltimatum = false;
          game.currentClue = null;
          game.guessesMade = 0;
        } else {
          // Check for win condition
          const redRemaining = game.cards.filter(c => c.team === "red" && !c.revealed).length;
          const blueRemaining = game.cards.filter(c => c.team === "blue" && !c.revealed).length;
          
          if (redRemaining === 0) {
            game.status = "ended";
            game.winner = "red";
            game.history.red++;
          } else if (blueRemaining === 0) {
            game.status = "ended";
            game.winner = "blue";
            game.history.blue++;
          }
        }

        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("giveClue", ({ roomId, clue }) => {
    const game = games[roomId];
    if (game && game.status === "playing") {
      const player = game.players.find(p => p.id === socket.id);
      const isSinglePlayer = game.players.length === 1;
      
      // Validate turn and role unless single player
      if (!isSinglePlayer) {
        if (!player || player.team !== game.turn || player.role !== "spymaster") {
          return;
        }
      }

      // Basic validation: single word
      if (clue.word.trim().includes(" ")) {
        socket.emit("error", "La pista debe ser una sola palabra.");
        return;
      }

      // In single player mode, ensure the clue team matches the current turn
      const finalClue = isSinglePlayer ? { ...clue, team: game.turn } : clue;

      game.clues.push(finalClue);
      game.currentClue = finalClue;
      game.guessesMade = 0;
      game.timer = game.config.timerDuration; // Reset timer for operatives
      game.isUltimatum = false;
      io.to(roomId).emit("gameStateUpdate", game);
    }
  });

  socket.on("endTurn", (roomId) => {
    const game = games[roomId];
    if (game && game.status === "playing") {
      game.turn = game.turn === "red" ? "blue" : "red";
      game.timer = game.config.timerDuration;
      game.isFirstTurn = false;
      game.isUltimatum = false;
      game.currentClue = null;
      game.guessesMade = 0;
      io.to(roomId).emit("gameStateUpdate", game);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in games) {
      const game = games[roomId];
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const wasHost = game.players[playerIndex].isHost;
        game.players.splice(playerIndex, 1);
        
        if (game.players.length === 0) {
          delete games[roomId];
        } else if (wasHost) {
          game.players[0].isHost = true;
        }
        
        io.to(roomId).emit("gameStateUpdate", game);
      }
    }
  });

  socket.on("returnToLobby", ({ roomId }) => {
    const game = games[roomId];
    if (game) {
      game.status = "lobby";
      game.winner = null;
      game.currentClue = null;
      game.guessesMade = 0;
      game.timer = game.config.timerDuration;
      // No reseteamos las cartas aún, se resetean al darle "Empezar Partida"
      io.to(roomId).emit("gameStateUpdate", game);
    }
  });
  
});

// Timer logic
setInterval(() => {
  for (const roomId in games) {
    const game = games[roomId];
    if (game.status === "playing") {
      if (game.timer === -1) continue; // Unlimited time

      game.timer--;
      
      if (game.timer <= 0) {
        if (!game.currentClue && !game.isUltimatum) {
          // Spymaster timeout - give 5s ultimatum
          game.timer = 5;
          game.isUltimatum = true;
        } else {
          // Operative timeout or ultimatum ended - auto pass turn
          game.turn = game.turn === "red" ? "blue" : "red";
          game.timer = game.config.timerDuration;
          game.isFirstTurn = false;
          game.isUltimatum = false;
          game.currentClue = null;
          game.guessesMade = 0;
        }
        io.to(roomId).emit("gameStateUpdate", game);
      } else {
        io.to(roomId).emit("timerUpdate", { roomId, timer: game.timer, turn: game.turn, isUltimatum: game.isUltimatum });
      }
    }
  }
}, 1000);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
