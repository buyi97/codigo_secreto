import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GameState } from "./lib/gameLogic";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";

// Conexión única usando la variable de entorno
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const socket: Socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"]
});

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") || "");
  const [roomId, setRoomId] = useState(() => localStorage.getItem("roomId") || "");

  useEffect(() => {
    // Escuchar actualizaciones del estado del juego
    socket.on("gameStateUpdate", (newGameState: GameState) => {
      setGameState(newGameState);
      localStorage.setItem("roomId", newGameState.roomId);
    });

    // Escuchar actualizaciones del temporizador
    socket.on("timerUpdate", ({ roomId: updatedRoomId, timer, turn, isUltimatum }) => {
      setGameState((prev) => {
        if (prev && prev.roomId === updatedRoomId) {
          return { ...prev, timer, turn, isUltimatum };
        }
        return prev;
      });
    });

    // Intentar reconexión automática si hay una sala guardada
    const savedRoomId = localStorage.getItem("roomId");
    const savedPlayerName = localStorage.getItem("playerName");
    if (savedRoomId && savedPlayerName) {
      socket.emit("joinRoom", { roomId: savedRoomId, playerName: savedPlayerName });
    }

    return () => {
      socket.off("gameStateUpdate");
      socket.off("timerUpdate");
    };
  }, []);

  const handleJoinRoom = (id: string, name: string, password?: string) => {
    setRoomId(id);
    setPlayerName(name);
    localStorage.setItem("playerName", name);
    socket.emit("joinRoom", { roomId: id, playerName: name, password });
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem("roomId");
    setGameState(null);
    setRoomId("");
    window.location.reload(); 
  };

  if (!gameState) {
    return (
      <Lobby 
        socket={socket} 
        onJoin={handleJoinRoom} 
        initialRoomId={roomId} 
        initialPlayerName={playerName} 
      />
    );
  }

  const currentPlayer = gameState.players.find((p) => p.id === socket.id);

  return (
    <div className="min-h-screen bg-bg text-text-main font-sans overflow-hidden">
      <GameRoom 
        gameState={gameState} 
        socket={socket} 
        currentPlayer={currentPlayer}
        onLeave={handleLeaveRoom}
      />
    </div>
  );
}