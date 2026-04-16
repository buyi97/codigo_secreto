import React, { useState, useEffect } from "react";
import { Users, Play, Shield, User, Hash } from "lucide-react";
import { motion } from "motion/react";
import { Socket } from "socket.io-client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LobbyProps {
  onJoin: (roomId: string, playerName: string, password?: string) => void;
  initialRoomId: string;
  initialPlayerName: string;
  socket: Socket;
}

export default function Lobby({ onJoin, initialRoomId, initialPlayerName, socket }: LobbyProps) {
  const [mode, setMode] = useState<"join" | "create">("join");
  const [roomId, setRoomId] = useState(initialRoomId);
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleRoomCreated = (newRoomId: string) => {
      onJoin(newRoomId, playerName, password);
    };
    const handleError = (msg: string) => setError(msg);

    socket.on("roomCreated", handleRoomCreated);
    socket.on("error", handleError);

    return () => {
      socket.off("roomCreated", handleRoomCreated);
      socket.off("error", handleError);
    };
  }, [socket, playerName, password, onJoin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!playerName) return;

    if (mode === "create") {
      socket.emit("createRoom", { playerName, password, isPublic });
    } else {
      if (roomId) {
        onJoin(roomId.toUpperCase(), playerName, password);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start md:justify-center p-4 md:p-6 bg-bg relative overflow-x-hidden overflow-y-auto custom-scrollbar">
      {/* Background decorations */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-team/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-team/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl z-10 py-8 flex flex-col landscape:lg:flex-row landscape:lg:items-center landscape:lg:justify-center landscape:lg:gap-12"
      >
        <div className="text-center mb-8 landscape:lg:mb-0 landscape:lg:text-left landscape:lg:flex-1">
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter text-white uppercase mb-2">
            Código <span className="text-red-team">Secreto</span>
          </h1>
          <p className="text-xs md:text-sm text-neutral-team font-black tracking-[0.3em] opacity-40 uppercase">Operación Digital • Versión 1.2</p>
          
          <div className="hidden landscape:lg:block mt-8 max-w-sm">
            <p className="text-base text-neutral-team/70 leading-relaxed font-medium">
              Bienvenido al centro de mando. Reúne a tu equipo, descifra las pistas y localiza a todos tus agentes antes que el rival.
            </p>
          </div>
        </div>

        <div className="glass-panel p-6 md:p-8 shadow-2xl border border-glass-border w-full max-w-md landscape:lg:flex-none mx-auto">
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-glass-border">
            <button 
              onClick={() => setMode("join")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                mode === "join" ? "bg-white text-bg shadow-lg" : "text-neutral-team hover:text-white"
              )}
            >
              Unirse
            </button>
            <button 
              onClick={() => setMode("create")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all",
                mode === "create" ? "bg-white text-bg shadow-lg" : "text-neutral-team hover:text-white"
              )}
            >
              Crear
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-team/20 border border-red-team text-red-team text-[10px] md:text-xs p-3 rounded-lg text-center font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-neutral-team opacity-50 ml-1">
                Identificación del Agente
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-team opacity-40" />
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Nombre en clave..."
                  maxLength={15}
                  required
                  className="w-full bg-white/5 border border-glass-border rounded-xl pl-11 md:pl-12 pr-4 py-3.5 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-blue-team transition-all placeholder:text-neutral-team/30"
                />
              </div>
            </div>

            {mode === "join" && (
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-neutral-team opacity-50 ml-1">
                  Frecuencia de la Sala
                </label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-neutral-team opacity-40" />
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Código de sala..."
                    maxLength={10}
                    required
                    className="w-full bg-white/5 border border-glass-border rounded-xl pl-11 md:pl-12 pr-4 py-3.5 md:py-4 text-sm md:text-base text-white font-mono tracking-widest focus:outline-none focus:border-red-team transition-all placeholder:text-neutral-team/30"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-neutral-team opacity-50 ml-1">
                Contraseña {mode === "create" ? "(Opcional)" : "(Si aplica)"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3.5 md:py-4 text-sm md:text-base text-white focus:outline-none focus:border-blue-team transition-all placeholder:text-neutral-team/30"
                />
              </div>
            </div>

            {mode === "create" && (
              <div className="flex items-center gap-3 p-3 md:p-4 bg-white/5 rounded-xl border border-glass-border">
                <input 
                  type="checkbox" 
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border bg-transparent text-blue-team focus:ring-blue-team"
                />
                <label htmlFor="isPublic" className="text-[10px] md:text-xs font-bold text-neutral-team uppercase tracking-wider cursor-pointer">
                  Sala Pública
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-bg py-3.5 md:py-4 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm hover:bg-white/90 transition-all shadow-xl active:scale-[0.98]"
            >
              {mode === "join" ? "Iniciar Misión" : "Establecer Cuartel"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-glass-border text-center">
            <p className="text-[9px] md:text-[10px] text-neutral-team opacity-40 uppercase tracking-widest leading-relaxed">
              Al unirte, aceptas los protocolos de seguridad <br /> y confidencialidad de la agencia.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}