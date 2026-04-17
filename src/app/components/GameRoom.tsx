import React from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Team, Role, PlayerTeam } from "../lib/gameLogic";
import Board from "./Board";
import Controls from "./Controls";
import ClueInput from "./ClueInput";
import ClueHistory from "./ClueHistory";
import Settings from "./Settings";
import { LogOut, Trophy, Clock, Users, Copy, Check, Power, Menu, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GameRoomProps {
  gameState: GameState;
  socket: Socket;
  currentPlayer?: Player;
  onLeave: () => void;
}

export default function GameRoom({ gameState, socket, currentPlayer, onLeave }: GameRoomProps) {
  const [copied, setCopied] = React.useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showTeamsPanel, setShowTeamsPanel] = React.useState(false);

  // Funciones de emisión de Sockets
  const handleSelectTeam = (team: PlayerTeam) => {
    if (gameState.status === "playing") return;
    socket.emit("selectTeam", { roomId: gameState.roomId, team });
  };

  const handleSelectRole = (role: Role) => {
    if (gameState.status === "playing") return;
    socket.emit("selectRole", { roomId: gameState.roomId, role });
  };

  const handleStartGame = () => {
    if (gameState.status === "playing") return;
    if (gameState.players.length > 1) {
      const redSpymaster = gameState.players.find(p => p.team === "red" && p.role === "spymaster");
      const blueSpymaster = gameState.players.find(p => p.team === "blue" && p.role === "spymaster");
      if (!redSpymaster || !blueSpymaster) {
        alert("Cada equipo debe tener un Líder (Spymaster) asignado antes de comenzar.");
        return;
      }
    }
    socket.emit("startGame", { roomId: gameState.roomId });
  };

  const handleReturnToLobby = () => {
    socket.emit("returnToLobby", { roomId: gameState.roomId });
  };

  const confirmTerminate = () => {
    socket.emit("terminateGame", gameState.roomId);
    setShowTerminateConfirm(false);
  };

  const confirmLeave = () => {
    onLeave();
    setShowLeaveConfirm(false);
  };

  const handleCardClick = (cardId: number) => {
    socket.emit("clickCard", { roomId: gameState.roomId, cardId });
  };

  const handleMovePlayer = (playerId: string, team?: PlayerTeam, role?: Role) => {
    socket.emit("movePlayer", { roomId: gameState.roomId, playerId, team, role });
  };

  const handleGiveClue = (word: string, count: number) => {
    if (currentPlayer && (currentPlayer.team === "red" || currentPlayer.team === "blue")) {
      socket.emit("giveClue", { 
        roomId: gameState.roomId, 
        clue: { word, count, team: currentPlayer.team } 
      });
    }
  };

  const handleEndTurn = () => {
    socket.emit("endTurn", gameState.roomId);
  };

  const handleUpdateConfig = (config: Partial<GameState["config"]>) => {
    socket.emit("updateConfig", { roomId: gameState.roomId, config });
  };

  const copyRoomLink = () => {
    const url = window.location.origin + "?room=" + gameState.roomId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cálculos de estado
  const history = gameState.history || { red: 0, blue: 0 };
  const redWins = history.red;
  const blueWins = history.blue;

  const redTotal = gameState.totalRed || gameState.cards.filter(c => c.team === "red").length || 9;
  const redRevealed = gameState.cards.filter(c => c.team === "red" && c.revealed).length;
  const blueTotal = gameState.totalBlue || gameState.cards.filter(c => c.team === "blue").length || 8;
  const blueRevealed = gameState.cards.filter(c => c.team === "blue" && c.revealed).length;

  const redRemaining = redTotal - redRevealed;
  const blueRemaining = blueTotal - blueRevealed;

  const isSinglePlayer = gameState.players.length === 1;
  const isMyTurn = isSinglePlayer || (currentPlayer?.team === gameState.turn);
  const effectiveIsSpymaster = isSinglePlayer ? !gameState.currentClue : (currentPlayer?.role === "spymaster");
  const isSpymaster = currentPlayer?.role === "spymaster";

  const canGiveClue = (effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !gameState.currentClue;
  const canClick = (!effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !!gameState.currentClue;
  const isHost = currentPlayer?.isHost;
  const isCriticalTime = gameState.status === "playing" && gameState.timer > 0 && gameState.timer <= 10 && !gameState.isUltimatum;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg relative">
      
      {/* HEADER GLOBAL - Siempre visible */}
      <header className="h-16 md:h-20 px-2 md:px-6 flex items-center justify-between bg-black/80 border-b border-white/10 shrink-0 z-20 backdrop-blur-2xl shadow-lg">
        
        {/* IZQUIERDA: Historial y Room ID */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex flex-col md:flex-row items-center md:gap-2 bg-white/5 px-3 py-1.5 md:py-2 rounded-xl border border-white/10">
            <span className="text-[9px] md:text-[11px] uppercase tracking-widest text-neutral-team font-black">Historial</span>
            <div className="flex items-center gap-2">
              <span className={cn("font-black transition-all", redWins > blueWins ? "text-xl md:text-2xl text-[#FF4B4B]" : "text-base md:text-lg text-[#FF4B4B]/70")}>{redWins}</span>
              <span className="text-white/20 text-sm">-</span>
              <span className={cn("font-black transition-all", blueWins > redWins ? "text-xl md:text-2xl text-[#4B9FFF]" : "text-base md:text-lg text-[#4B9FFF]/70")}>{blueWins}</span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 bg-black/50 text-white px-3 py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-team uppercase font-bold">Sala:</span>
            <span className="font-mono text-sm font-bold text-primary">{gameState.roomId}</span>
            <button onClick={copyRoomLink} className="p-1 hover:bg-white/10 rounded transition-colors">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-neutral-team" />}
            </button>
          </div>
        </div>

        {/* CENTRO: Marcadores, Timer y Estado de Turno */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 absolute left-1/2 -translate-x-1/2">
          
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1 px-3 py-1 md:py-1.5 rounded-lg bg-[#FF4B4B]/10 border border-[#FF4B4B]/30 shadow-[0_0_10px_rgba(255,75,75,0.1)]">
              <span className="text-sm md:text-xl font-black text-[#FF4B4B] leading-none">{redRemaining}</span>
              <span className="text-[10px] md:text-xs font-bold text-[#FF4B4B]/70 uppercase leading-none">/{redTotal}</span>
            </div>
            
            {/* Timer Central */}
            <div className={cn(
              "flex items-center justify-center min-w-[60px] md:min-w-[80px] py-1 md:py-1.5 rounded-lg border backdrop-blur-md transition-all",
              gameState.isUltimatum ? "bg-[#FF4B4B]/30 border-[#FF4B4B] animate-pulse shadow-[0_0_15px_rgba(255,75,75,0.5)]" : 
              (isCriticalTime ? "bg-[#FF4B4B]/80 border-[#FF4B4B] shadow-[0_0_20px_rgba(255,75,75,0.8)]" : "bg-black/40 border-white/10")
            )}>
              <span className={cn(
                "font-mono text-sm md:text-xl font-bold",
                (gameState.isUltimatum || isCriticalTime) ? "text-white" : (gameState.timer < 15 && gameState.timer !== -1 ? "text-red-500 animate-pulse" : "text-amber-400")
              )}>
                {gameState.timer === -1 ? "∞" : `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`}
              </span>
            </div>

            <div className="flex items-baseline gap-1 px-3 py-1 md:py-1.5 rounded-lg bg-[#4B9FFF]/10 border border-[#4B9FFF]/30 shadow-[0_0_10px_rgba(75,159,255,0.1)]">
              <span className="text-sm md:text-xl font-black text-[#4B9FFF] leading-none">{blueRemaining}</span>
              <span className="text-[10px] md:text-xs font-bold text-[#4B9FFF]/70 uppercase leading-none">/{blueTotal}</span>
            </div>
          </div>

          {/* Turn Indicator */}
          <div className="hidden lg:block text-xs md:text-sm font-bold uppercase tracking-wider">
            {gameState.status === "lobby" ? (
              <span className="text-neutral-team">En Cuartel</span>
            ) : gameState.status === "finished" ? (
              <span className="text-green-400">Misión Finalizada</span>
            ) : (
              <>
                Turno <span className={gameState.turn === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]"}>{gameState.turn === "red" ? "Rojo" : "Azul"}</span>
                <span className="text-white/50 ml-2">({gameState.currentClue ? "Adivinando" : "Pensando pista"})</span>
              </>
            )}
          </div>
        </div>

        {/* DERECHA: Equipos y Salir */}
        <div className="flex items-center gap-2 md:gap-3">
          {gameState.status === "playing" && (
             <button 
               onClick={() => setShowTeamsPanel(true)}
               className="p-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all shadow-lg flex items-center gap-2"
             >
               <Users className="w-5 h-5" />
               <span className="hidden xl:inline text-sm font-bold">Equipos</span>
             </button>
          )}
          
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2.5 hover:bg-[#FF4B4B]/20 rounded-xl transition-colors border border-white/20 backdrop-blur-md group"
            title="Salir de la sala"
          >
            <LogOut className="w-5 h-5 text-neutral-team group-hover:text-[#FF4B4B]" />
          </button>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ================= ESTADO: LOBBY ================= */}
        {gameState.status === "lobby" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              
              {/* Panel Izquierdo: Equipos */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col h-[calc(100vh-140px)]">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black uppercase text-white flex items-center gap-2">
                      <Users className="text-primary" /> Agentes Asignados
                    </h2>
                    <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full">{gameState.players.length} / {gameState.config.maxPlayers || 10}</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                   <Controls 
                     players={gameState.players}
                     currentPlayer={currentPlayer}
                     onSelectTeam={handleSelectTeam}
                     onSelectRole={handleSelectRole}
                     onStartGame={handleStartGame}
                     onMovePlayer={handleMovePlayer}
                     gameStatus={gameState.status}
                     maxPlayers={gameState.config.maxPlayers}
                   />
                 </div>

                 {isHost && (
                   <button 
                     onClick={handleStartGame}
                     className="mt-6 w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black text-xl rounded-xl shadow-[0_0_20px_rgba(75,159,255,0.4)] transform hover:scale-[1.02] transition-all shrink-0"
                   >
                     INICIAR MISIÓN
                   </button>
                 )}
              </div>

              {/* Panel Derecho: Ajustes Completos */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl h-auto xl:h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
                 {/* Se renderiza el componente Settings, como ahora es embebido no necesita botón cerrar */}
                 <Settings 
                    config={gameState.config}
                    onUpdate={handleUpdateConfig}
                    onClose={() => {}} // No hace nada porque ahora está siempre abierto
                    isHost={isHost || false}
                 />
              </div>

            </div>
          </div>
        )}

        {/* ================= ESTADO: JUGANDO o FINALIZADO ================= */}
        {gameState.status !== "lobby" && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0">
             
             {/* Panel Central: Tablero */}
             <div className="flex-1 flex flex-col p-2 md:p-6 overflow-hidden relative">
               <div className={cn(
                 "flex-1 flex items-center justify-center transition-opacity duration-700",
                 gameState.status === "finished" ? "opacity-40 pointer-events-none grayscale-[30%]" : "opacity-100"
               )}>
                 {/* El Board debe manejar su propio CSS para ser responsive (aspect-square/clamp font) */}
                 <div className="w-full max-w-5xl max-h-full aspect-[4/5] sm:aspect-square flex items-center justify-center p-2">
                   <Board 
                     cards={gameState.cards} 
                     isSpymaster={effectiveIsSpymaster} 
                     onCardClick={handleCardClick}
                     canClick={canClick}
                   />
                 </div>
               </div>

               {/* Footer In-Game (Pasar Turno / Terminar) */}
               {gameState.status === "playing" && (
                 <div className="shrink-0 mt-4 flex items-center justify-center gap-4">
                   {isHost && (
                     <button 
                       onClick={() => setShowTerminateConfirm(true)}
                       className="px-6 py-3 rounded-xl text-sm font-bold bg-[#FF4B4B]/10 text-[#FF4B4B] border border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/20 transition-all flex items-center gap-2"
                     >
                       <Power className="w-4 h-4" /> Terminar
                     </button>
                   )}

                   {((!isSpymaster && isMyTurn) || (isSinglePlayer && gameState.currentClue)) && (
                     <button 
                       onClick={handleEndTurn}
                       className="bg-white text-bg px-8 py-3 rounded-xl text-sm font-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                     >
                       PASAR TURNO
                     </button>
                   )}
                 </div>
               )}
             </div>

             {/* Sidebar Derecho: Pistas o Victoria */}
             <aside className="w-full lg:w-80 xl:w-96 shrink-0 bg-white/5 border-l border-white/10 flex flex-col shadow-2xl z-10">
                {gameState.status === "finished" ? (
                  // PANEL DE VICTORIA
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className={cn(
                        "p-6 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                        gameState.winner === "red" ? "bg-[#FF4B4B]/20 text-[#FF4B4B]" : "bg-[#4B9FFF]/20 text-[#4B9FFF]"
                      )}
                    >
                      <Trophy className="w-20 h-20" />
                    </motion.div>
                    
                    <div>
                      <h2 className="text-4xl font-black uppercase text-white mb-2">Misión<br/>Completada</h2>
                      <p className={cn("text-2xl font-bold", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")}>
                        ¡Ganó el Equipo {gameState.winner === "red" ? "Rojo" : "Azul"}!
                      </p>
                    </div>
                    
                    {isHost && (
                      <button 
                        onClick={handleReturnToLobby}
                        className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" /> VOLVER AL CUARTEL
                      </button>
                    )}
                    {!isHost && (
                      <p className="text-neutral-team text-sm mt-8">Esperando que el líder reinicie la sala...</p>
                    )}
                  </div>
                ) : (
                  // PANEL DE PISTAS (In-Game)
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-black/20 shrink-0">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-team text-center">Registro de Inteligencia</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      <ClueHistory clues={gameState.clues || []} />
                    </div>

                    {gameState.currentClue && (
                      <div className="shrink-0 p-4 bg-black/40 border-t border-white/10">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
                          <span className="text-[10px] uppercase font-black text-neutral-team mb-1 block">Adivinadas / Total</span>
                          <span className="text-2xl font-black text-white">
                            {gameState.guessesMade} <span className="text-white/30 mx-1">/</span> {gameState.currentClue.count === 0 ? "∞" : gameState.currentClue.count}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 p-4 border-t border-white/10 bg-bg-dark/50">
                      <ClueInput 
                        onGiveClue={handleGiveClue} 
                        disabled={!canGiveClue}
                        isMyTurn={isMyTurn}
                        isSpymaster={effectiveIsSpymaster}
                        teamWordsRemaining={gameState.turn === "red" ? redRemaining : blueRemaining}
                        boardWords={gameState.cards.map(c => c.word)}
                      />
                    </div>
                  </div>
                )}
             </aside>
          </div>
        )}
      </main>

      {/* PANEL FLOTANTE DE EQUIPOS (Visible por botón In-Game) */}
      <AnimatePresence>
        {showTeamsPanel && gameState.status === "playing" && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamsPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-bg/95 backdrop-blur-2xl border-r border-white/20 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg text-white flex items-center gap-2"><Users className="text-primary"/> Agentes</h3>
                <button onClick={() => setShowTeamsPanel(false)} className="p-2 hover:bg-white/10 rounded-lg text-neutral-team transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <Controls 
                  players={gameState.players}
                  currentPlayer={currentPlayer}
                  onSelectTeam={handleSelectTeam}
                  onSelectRole={handleSelectRole}
                  onStartGame={handleStartGame}
                  onMovePlayer={handleMovePlayer}
                  gameStatus={gameState.status}
                  maxPlayers={gameState.config.maxPlayers}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODALES DE CONFIRMACIÓN */}
      <AnimatePresence>
        {showTerminateConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg/90 backdrop-blur-xl border border-[#FF4B4B]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,75,75,0.2)]"
            >
              <Power className="w-12 h-12 text-[#FF4B4B] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">¿Terminar Misión?</h3>
              <p className="text-sm text-neutral-team mb-6">La partida actual se cancelará y volverán al cuartel.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTerminateConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmTerminate}
                  className="flex-1 py-3 rounded-xl bg-[#FF4B4B] text-white font-bold hover:bg-[#FF4B4B]/80 shadow-[0_0_15px_rgba(255,75,75,0.4)] transition-all"
                >
                  Terminar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <LogOut className="w-12 h-12 text-neutral-team mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">¿Abandonar Sala?</h3>
              <p className="text-sm text-neutral-team mb-6">Saldrás de este cuartel y perderás tu puesto.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl bg-white text-bg font-bold hover:bg-white/90 transition-all"
                >
                  Abandonar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}