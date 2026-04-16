import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, Player } from "./lib/gameLogic";
import Lobby from "./components/Lobby";
import GameRoom from "./components/GameRoom";

const socket: Socket = io();

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") || "");
  const [roomId, setRoomId] = useState(() => localStorage.getItem("roomId") || "");

  useEffect(() => {
    socket.on("gameStateUpdate", (newGameState: GameState) => {
      setGameState(newGameState);
      localStorage.setItem("roomId", newGameState.roomId);
    });

    socket.on("timerUpdate", ({ roomId: updatedRoomId, timer, turn, isUltimatum }) => {
      setGameState((prev) => {
        if (prev && prev.roomId === updatedRoomId) {
          return { ...prev, timer, turn, isUltimatum };
        }
        return prev;
      });
    });

    // Rejoin if we have a roomId
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
    window.location.reload(); // Simple way to reset socket state
  };

  if (!gameState) {
    return <Lobby onJoin={handleJoinRoom} initialRoomId={roomId} initialPlayerName={playerName} />;
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
