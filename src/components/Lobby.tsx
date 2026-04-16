import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface LobbyProps {
  onJoin: (id: string, name: string, password?: string) => void;
  initialRoomId?: string;
  initialPlayerName?: string;
  socket: Socket; 
}

export default function Lobby({ onJoin, initialRoomId = "", initialPlayerName = "", socket }: LobbyProps) {
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [joinRoomId, setJoinRoomId] = useState(initialRoomId);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    socket.on("roomCreated", (newRoomId) => {
      onJoin(newRoomId, playerName, password);
    });

    socket.on("error", (msg) => {
      setError(msg);
    });

    return () => {
      socket.off("roomCreated");
      socket.off("error");
    };
  }, [socket, playerName, password, onJoin]);

  const handleCreateRoom = (isPublic: boolean) => {
    if (!playerName.trim()) return setError("Elegí un nombre de agente");
    socket.emit("createRoom", { playerName, password, isPublic });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return setError("Elegí un nombre de agente");
    if (!joinRoomId.trim()) return setError("Ingresá un código de sala");
    onJoin(joinRoomId, playerName, password);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg text-text-main">
      <div className="w-full max-w-md p-8 bg-surface rounded-xl border border-border shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-8 tracking-tighter text-primary">CÓDIGO SECRETO</h1>
        
        {error && <div className="p-3 mb-4 bg-red-500/20 border border-red-500 text-red-200 rounded text-sm text-center">{error}</div>}

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Tu Alias</label>
            <input 
              type="text" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-3 bg-bg-dark border border-border rounded focus:border-primary outline-none"
              placeholder="Ej: Agente 007"
            />
          </div>

          <div className="pt-4 border-t border-border/50">
             <button 
              onClick={() => handleCreateRoom(true)}
              className="w-full p-3 bg-primary hover:bg-primary-hover text-bg font-bold rounded transition-all"
            >
              ESTABLECER CUARTEL (NUEVA SALA)
            </button>
          </div>

          <form onSubmit={handleJoinRoom} className="pt-4 border-t border-border/50 space-y-3">
            <input 
              type="text" 
              value={joinRoomId} 
              onChange={(e) => setJoinRoomId(e.target.value)}
              className="w-full p-3 bg-bg-dark border border-border rounded focus:border-primary outline-none"
              placeholder="Código de Sala"
            />
            <button 
              type="submit"
              className="w-full p-3 bg-surface-lighter hover:bg-border border border-border text-text-main font-bold rounded"
            >
              UNIRSE A MISIÓN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}