import React, { useState, useEffect } from "react";
import { Users, Play, Shield, User, Hash, Lock, Globe } from "lucide-react";
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
    // FIX CLAVE PARA SCROLL MOBILE: block y min-h-screen en lugar de flex centrado restrictivo.
    <div className="min-h-[100dvh] w-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] relative overflow-x-hidden overflow-y-auto custom-scrollbar">
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF4B4B]/10 blur-[120px] rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#4B9FFF]/10 blur-[120px] rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      {/* Contenedor fluido con padding vertical grande para que se pueda scrollear si no entra */}
      <div className="w-full flex-1 flex flex-col py-10 px-4 md:px-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          // my-auto lo centra verticalmente solo si la pantalla es más alta que el contenido
          className="w-full max-w-6xl mx-auto my-auto flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-12"
        >
          {/* Left side - Branding */}
          <div className="text-center lg:text-left lg:flex-1 space-y-6 w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase mb-4 leading-none">
                Código<br />
                <span className="bg-gradient-to-r from-[#FF4B4B] to-[#4B9FFF] bg-clip-text text-transparent">
                  Secreto
                </span>
              </h1>
              <p className="text-xs md:text-sm text-neutral-team/60 font-bold tracking-[0.3em] uppercase">
                Operación Digital • Versión 1.2
              </p>
            </motion.div>
            
            <motion.div 
              className="hidden lg:block max-w-md space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-base text-neutral-team/80 leading-relaxed">
                Bienvenido al centro de mando. Reúne a tu equipo, descifra las pistas y localiza a todos tus agentes antes que el rival.
              </p>
              <div className="flex gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#FF4B4B] shadow-[0_0_8px_rgba(255,75,75,0.8)]" />
                  <span className="text-neutral-team/70">Equipo Rojo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#4B9FFF] shadow-[0_0_8px_rgba(75,159,255,0.8)]" />
                  <span className="text-neutral-team/70">Equipo Azul</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right side - Form */}
          <motion.div 
            className="w-full max-w-md lg:flex-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-xl border border-white/10">
                <button 
                  type="button"
                  onClick={() => setMode("join")}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    mode === "join" 
                      ? "bg-white text-black shadow-lg" 
                      : "text-neutral-team hover:text-white"
                  )}
                >
                  Unirse
                </button>
                <button 
                  type="button"
                  onClick={() => setMode("create")}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    mode === "create" 
                      ? "bg-white text-black shadow-lg" 
                      : "text-neutral-team hover:text-white"
                  )}
                >
                  Crear
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#FF4B4B]/20 border border-[#FF4B4B] text-[#FF4B4B] text-xs p-3 rounded-lg text-center font-bold"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Player Name */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-neutral-team/50 ml-1">
                    Identificación del Agente
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-team/40 transition-colors group-focus-within:text-white/60" />
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Nombre en clave..."
                      maxLength={15}
                      required
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base text-white focus:outline-none focus:border-[#4B9FFF] transition-all placeholder:text-neutral-team/30"
                    />
                  </div>
                </div>

                {/* Room ID (Join mode) */}
                {mode === "join" && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-team/50 ml-1">
                      Frecuencia de la Sala
                    </label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-team/40 transition-colors group-focus-within:text-white/60" />
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                        placeholder="Código de sala..."
                        maxLength={10}
                        required
                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base text-white font-mono tracking-widest focus:outline-none focus:border-[#FF4B4B] transition-all placeholder:text-neutral-team/30 uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-neutral-team/50 ml-1">
                    Contraseña {mode === "create" ? "(Opcional)" : "(Si aplica)"}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-team/40 transition-colors group-focus-within:text-white/60" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base text-white focus:outline-none focus:border-[#4B9FFF] transition-all placeholder:text-neutral-team/30"
                    />
                  </div>
                </div>

                {/* Public checkbox (Create mode) */}
                {mode === "create" && (
                  <div className="flex items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/10">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="peer w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-[#4B9FFF] checked:border-[#4B9FFF] appearance-none cursor-pointer transition-all shrink-0 m-0"
                      />
                      <svg 
                        className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                    <label htmlFor="isPublic" className="flex items-center gap-2 text-sm font-bold text-white cursor-pointer select-none">
                      <Globe className="w-4 h-4 text-neutral-team" />
                      Sala Pública
                    </label>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#FF4B4B] to-[#4B9FFF] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:shadow-lg hover:shadow-[#FF4B4B]/20 transition-all mt-2"
                >
                  {mode === "join" ? "Iniciar Misión" : "Establecer Cuartel"}
                </motion.button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-[10px] text-neutral-team/40 uppercase tracking-widest leading-relaxed">
                  Al unirte, aceptas los protocolos de seguridad<br />
                  y confidencialidad de la agencia.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}