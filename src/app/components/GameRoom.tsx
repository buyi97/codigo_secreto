import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Role, PlayerTeam } from "../lib/gameLogic";
import Board from "./Board";
import Controls from "./Controls";
import ClueInput from "./ClueInput";
import ClueHistory from "./ClueHistory";
import Settings from "./Settings";
import { LogOut, Trophy, Users, Copy, Check, Power, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

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
  const [copied, setCopied] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTeamsPanel, setShowTeamsPanel] = useState(false);
  
  // Estado local para que los jugadores puedan volver a su lobby independientemente
  const [localLobbyView, setLocalLobbyView] = useState(false);

  const isGameEnded = gameState.status === "ended" || gameState.status === "finished";

  useEffect(() => {
    // Si el ADMIN reinicia la partida, forzamos a todos a salir de su lobby local
    if (gameState.status === "playing") {
      setLocalLobbyView(false);
    }
  }, [gameState.status]);

  const effectiveStatus = localLobbyView ? "lobby" : gameState.status;

  const handleVolverAlCuartel = () => {
    // Cuando tocan el botón, todos pasan a su lobby local
    setLocalLobbyView(true);
  };

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
    if (gameState.config.wordBankMode === "replace" && (gameState.config.customWords?.length || 0) < 25) {
      toast.error("Mínimo 25 palabras para usar un banco personalizado."); // Cambiado aquí
      return;
    }
    if (gameState.players.length > 1) {
      const redSpymaster = gameState.players.find(p => p.team === "red" && p.role === "spymaster");
      const blueSpymaster = gameState.players.find(p => p.team === "blue" && p.role === "spymaster");
      if (!redSpymaster || !blueSpymaster) {
        toast.error("Cada equipo debe tener un Líder asignado."); // Cambiado aquí
        return;
      }
    }
    socket.emit("startGame", gameState.roomId);
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
      socket.emit("giveClue", { roomId: gameState.roomId, clue: { word, count, team: currentPlayer.team } });
    }
  };

  const handleEndTurn = () => {
    socket.emit("endTurn", gameState.roomId);
  };

  const handleUpdateConfig = (config: Partial<GameState["config"]>) => {
    socket.emit("updateConfig", { roomId: gameState.roomId, config });
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Cálculos de Puntuación
  const history = gameState.history || { red: 0, blue: 0 };
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
  const isMyActiveTurn = canGiveClue || canClick;
  const isHost = currentPlayer?.isHost;
  const isCriticalTime = gameState.status === "playing" && gameState.timer > 0 && gameState.timer <= 10 && !gameState.isUltimatum;

  const turnPhase = gameState.currentClue ? "ELECCIÓN" : "PISTA";
  const turnTeamName = gameState.turn === "red" ? "ROJO" : "AZUL";
  const turnTeamColor = gameState.turn === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]";

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg relative">
      
      {/* ================= BARRA SUPERIOR (HORIZONTAL MEJORADA) ================= */}
      <header className="w-full flex flex-col md:flex-row items-center justify-between bg-black/90 border-b border-white/10 shrink-0 z-20 p-2 px-3 md:px-6 lg:h-28 gap-2 md:gap-6 shadow-lg">
        
        {/* IZQUIERDA: Historial y Sala */}
        <div className="flex flex-wrap items-center justify-between md:justify-start w-full md:w-auto gap-2 shrink-0">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 bg-white/5 px-3 py-1.5 md:px-5 md:py-3 rounded-xl border border-white/10">
            <span className="text-[9px] md:text-sm uppercase tracking-widest text-neutral-team font-black mr-1">Historial</span>
            <div className="flex items-center">
              <span className={cn("font-black text-sm md:text-2xl transition-all", history.red > history.blue ? "text-[#FF4B4B]" : "text-[#FF4B4B]/70")}>{history.red}</span>
              <span className="text-white/20 text-xs md:text-xl mx-1">-</span>
              <span className={cn("font-black text-sm md:text-2xl transition-all", history.blue > history.red ? "text-[#4B9FFF]" : "text-[#4B9FFF]/70")}>{history.blue}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-black/50 text-white px-3 py-2 md:px-5 md:py-3 rounded-xl border border-white/10">
            <span className="hidden sm:inline text-[10px] md:text-sm text-neutral-team uppercase font-bold">Sala:</span>
            <span className="font-mono text-sm md:text-xl font-bold text-primary tracking-widest">{gameState.roomId}</span>
            <button onClick={copyRoomLink} className="p-1 hover:bg-white/10 rounded transition-colors ml-1">
              {copied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-400" /> : <Copy className="w-4 h-4 md:w-5 md:h-5 text-neutral-team" />}
            </button>
          </div>

          {/* NUEVO: Botón Salir siempre visible */}
            <button 
              onClick={() => setShowLeaveConfirm(true)} 
              className="p-2 md:p-3 hover:bg-[#FF4B4B]/20 rounded-xl transition-colors border border-white/10 backdrop-blur-md group ml-1"
              title="Abandonar Sala"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-neutral-team group-hover:text-[#FF4B4B]" />
            </button>

          {/* NUEVO: Indicador de Equipo (Aquí se verá en PC y Mobile) */}
          {currentPlayer && (currentPlayer.team === "red" || currentPlayer.team === "blue") && (
             <div className={cn(
                "px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-widest border shadow-sm ml-1",
                currentPlayer.team === "red" ? "bg-[#FF4B4B]/10 text-[#FF4B4B] border-[#FF4B4B]/30" : "bg-[#4B9FFF]/10 text-[#4B9FFF] border-[#4B9FFF]/30"
             )}>
               Agente {currentPlayer.team === "red" ? "Rojo" : "Azul"}
             </div>
          )}
        </div>

        {/* CENTRO: Marcadores o Cartel de Victoria */}
        {effectiveStatus !== "lobby" && (
          <div className="w-full md:flex-1 flex items-center justify-between md:justify-center gap-2 mt-1 md:mt-0 px-2 md:px-8">
            
            {/* SI TERMINÓ LA PARTIDA -> CARTEL EN LA BARRA */}
            {isGameEnded ? (
              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 animate-in zoom-in duration-500 py-1 bg-white/5 rounded-xl border border-white/10 px-4 md:px-8">
                <Trophy className={cn("hidden md:block w-8 h-8 lg:w-12 lg:h-12", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")} />
                <div className="flex flex-col items-center">
                  <h2 className="text-base md:text-2xl lg:text-3xl font-black uppercase text-white tracking-widest leading-none">
                    Misión Completada
                  </h2>
                  <span className={cn("text-xs md:text-lg lg:text-xl font-bold uppercase tracking-widest mt-1", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")}>
                    ¡Victoria del Equipo {gameState.winner === "red" ? "Rojo" : "Azul"}!
                  </span>
                </div>
                <Trophy className={cn("w-6 h-6 md:w-8 md:h-8 lg:w-12 lg:h-12", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")} />
              </div>
            ) : (
              /* SI ESTÁ JUGANDO -> MARCADORES DISTRIBUIDOS */
              <>
                <div className="flex-1 flex justify-end md:justify-center">
                  <div className="flex items-baseline gap-1 md:gap-3 px-3 md:px-6 py-1.5 md:py-3 rounded-xl bg-[#FF4B4B]/10 border border-[#FF4B4B]/30 shadow-inner">
                    <span className="text-xl md:text-4xl lg:text-5xl font-black text-[#FF4B4B] leading-none">{redRemaining}</span>
                    <span className="text-xs md:text-base lg:text-xl font-bold text-[#FF4B4B]/60 leading-none">/{redTotal}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center shrink-0 md:px-8">
                  <div className="text-[10px] md:text-sm lg:text-lg font-black uppercase tracking-widest leading-none mb-1 md:mb-2 text-center">
                    TURNO {turnPhase} <span className={turnTeamColor}>{turnTeamName}</span>
                  </div>
                  <div className={cn(
                    "px-4 py-1 md:px-8 md:py-2 rounded-lg md:rounded-xl border font-mono text-base md:text-3xl lg:text-4xl font-bold transition-all shadow-md leading-none text-center",
                    gameState.isUltimatum ? "bg-[#FF4B4B]/30 border-[#FF4B4B] animate-pulse" : 
                    (isCriticalTime ? "bg-[#FF4B4B]/80 border-[#FF4B4B]" : "bg-black/40 border-white/10 text-amber-400")
                  )}>
                    {gameState.timer === -1 ? "∞" : `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`}
                  </div>
                </div>

                <div className="flex-1 flex justify-start md:justify-center">
                  <div className="flex items-baseline gap-1 md:gap-3 px-3 md:px-6 py-1.5 md:py-3 rounded-xl bg-[#4B9FFF]/10 border border-[#4B9FFF]/30 shadow-inner">
                    <span className="text-xl md:text-4xl lg:text-5xl font-black text-[#4B9FFF] leading-none">{blueRemaining}</span>
                    <span className="text-xs md:text-base lg:text-xl font-bold text-[#4B9FFF]/60 leading-none">/{blueTotal}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DERECHA: Botones de Config */}
        <div className="hidden md:flex items-center justify-end w-full md:w-auto gap-3 shrink-0">

          {gameState.status === "playing" && (
             <button onClick={() => setShowTeamsPanel(true)} className="px-4 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-all shadow-lg">
               <Users className="w-5 h-5 lg:w-6 lg:h-6" /> <span className="text-sm lg:text-base font-bold">Equipos</span>
             </button>
          )}
          
        </div>
      </header>

      {/* ================= ÁREA PRINCIPAL ================= */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* --- ESTADO: LOBBY --- */}
        {effectiveStatus === "lobby" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full flex flex-col xl:grid xl:grid-cols-2 gap-6 md:gap-8 items-start">
              
              {/* Panel Equipos */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 md:p-8 shadow-2xl flex flex-col w-full h-[500px] xl:h-[calc(100vh-180px)]">
                 <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                    <h2 className="text-2xl lg:text-3xl font-black uppercase text-white flex items-center gap-2">
                      <Users className="text-primary w-6 h-6 lg:w-8 lg:h-8" /> Agentes
                    </h2>
                 </div>
                 
                 <div className="flex-1 overflow-hidden">
                   <Controls 
                     players={gameState.players} currentPlayer={currentPlayer}
                     onSelectTeam={handleSelectTeam} onSelectRole={handleSelectRole}
                     onStartGame={handleStartGame} onMovePlayer={handleMovePlayer}
                     gameStatus={gameState.status} maxPlayers={gameState.config.maxPlayers}
                   />
                 </div>

                 {isHost && (
                   <button 
                     onClick={handleStartGame}
                     className="mt-6 w-full py-4 lg:py-5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black text-xl lg:text-2xl rounded-xl shadow-[0_0_20px_rgba(75,159,255,0.4)] transform hover:scale-[1.02] transition-all shrink-0"
                   >
                     INICIAR PARTIDA
                   </button>
                 )}
              </div>

              {/* Panel Ajustes */}
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5 md:p-8 shadow-2xl w-full min-h-[600px] xl:h-[calc(100vh-180px)] flex flex-col">
                 <Settings 
                    config={gameState.config}
                    onUpdate={handleUpdateConfig}
                    onClose={() => {}} 
                    isHost={isHost || false}
                 />
              </div>

            </div>
          </div>
        )}

        {/* --- ESTADO: JUEGO ACTIVO O FINALIZADO --- */}
        {effectiveStatus !== "lobby" && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full relative">
             
             {/* COLUMNA CENTRAL (Tablero + Acciones) */}
             <div className="flex-1 flex flex-col min-w-0 min-h-0 relative p-2 md:p-4">
                
                {/* Tablero: Adaptable */}
                <div className="flex-1 w-full min-h-0 flex items-stretch justify-center relative mb-2 md:mb-4">
                   <div className={cn(
                     "w-full max-w-6xl h-full flex transition-opacity duration-700 mx-auto",
                     isGameEnded && "opacity-80" // Se mantiene visible
                     isMyActiveTurn && "ring-4 ring-amber-400 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] z-10"
                   )}>
                     <Board cards={gameState.cards} isSpymaster={effectiveIsSpymaster} onCardClick={handleCardClick} canClick={canClick} />
                   </div>
                </div>

                {/* BOTONES FIJOS ABAJO DEL TABLERO */}
                <div className="shrink-0 flex flex-wrap items-center justify-center gap-2 md:gap-4 z-20 pointer-events-auto">
                  {isGameEnded ? (
                    // === BOTÓN VOLVER AL LOBBY PARA TODOS (Solo sale al finalizar) ===
                    <button 
                      onClick={handleVolverAlCuartel} 
                      className="w-full md:w-auto py-3 md:py-4 px-6 md:px-10 bg-primary hover:bg-primary-hover text-white font-black text-sm md:text-xl rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(75,159,255,0.4)] transition-all flex items-center justify-center gap-3"
                    >
                        <RotateCcw className="w-5 h-5 md:w-7 md:h-7" /> Volver al lobby de sala
                    </button>
                  ) : (
                    // === BOTONES JUGANDO ===
                    <>
                      {isHost && (
                        <button 
                          onClick={() => setShowTerminateConfirm(true)} 
                          className="px-4 py-3 md:px-8 md:py-4 rounded-xl text-xs md:text-base font-bold bg-[#FF4B4B]/10 text-[#FF4B4B] border border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/20 transition-all flex items-center gap-2"
                        >
                          <Power className="w-5 h-5" /> <span className="hidden sm:inline">Terminar</span>
                        </button>
                      )}
                      
                      {/* CÓDIGO ACTUALIZADO */}
                      {((!isSpymaster && isMyTurn && gameState.currentClue) || (isSinglePlayer && gameState.currentClue)) && (
                        <button 
                          onClick={handleEndTurn} 
                          className="flex-1 md:flex-none md:w-[400px] py-3 md:py-4 bg-white text-bg rounded-xl text-sm md:text-lg font-black uppercase tracking-widest hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all active:scale-95"
                        >
                          Pasar Turno
                        </button>
                      )}
                    </>
                  )}
                </div>
             </div>

             {/* SIDEBAR LATERAL O INFERIOR EN MOBILE */}
             <aside className={cn(
                "w-full lg:w-80 xl:w-[400px] shrink-0 flex flex-col bg-bg-dark border-t lg:border-t-0 lg:border-l border-white/10 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] lg:shadow-none",
                "h-[40vh] lg:h-auto" // En mobile ocupa fijo un 40% del alto, en PC ocupa toda la altura
             )}>
                <div className="p-3 lg:p-4 border-b border-white/10 bg-black/20 text-center text-xs lg:text-sm font-bold uppercase tracking-widest text-neutral-team shrink-0">
                  Registro de Inteligencia
                </div>
                
                {/* Historial */}
                <div className="flex-1 overflow-y-auto p-2 lg:p-4 custom-scrollbar min-h-0 bg-black/10">
                  <ClueHistory 
                    clues={gameState.clues || []} 
                    isMyActiveTurn={isMyActiveTurn} // <-- Nueva prop
                  />
                </div>

                {/* Info de Pista Activa */}
                {gameState.currentClue && !isGameEnded && (
                  <div className="shrink-0 p-3 lg:p-5 bg-black/40 border-t border-white/10 flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs uppercase text-neutral-team font-bold">Pista Activa</span>
                      <span className="text-base md:text-xl font-black text-white">
                        {gameState.currentClue.word} <span className="text-primary">({gameState.currentClue.count})</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] md:text-xs uppercase text-neutral-team font-bold">Adivinadas</span>
                      <span className="text-base md:text-xl font-bold text-white">
                        {gameState.guessesMade} / {gameState.currentClue.count === 0 ? "∞" : gameState.currentClue.count}
                      </span>
                    </div>
                  </div>
                )}

                {/* Input de Pistas */}
                {!isGameEnded && effectiveIsSpymaster && (
                  <div className="shrink-0 p-3 lg:p-5 bg-bg border-t border-white/10">
                    <ClueInput 
                      onGiveClue={handleGiveClue} disabled={!canGiveClue}
                      isMyTurn={isMyTurn} isSpymaster={effectiveIsSpymaster}
                      teamWordsRemaining={gameState.turn === "red" ? redRemaining : blueRemaining}
                      boardWords={gameState.cards.map(c => c.word)}
                    />
                  </div>
                )}
             </aside>
          </div>
        )}
      </main>

      {/* ================= MODALES FLOTANTES ================= */}
      <AnimatePresence>
        {showTeamsPanel && gameState.status === "playing" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamsPanel(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-full max-w-sm md:max-w-md bg-bg/95 backdrop-blur-2xl border-r border-white/20 z-50 flex flex-col shadow-2xl">
              <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-xl text-white flex items-center gap-2"><Users className="text-primary"/> Agentes</h3>
                <button onClick={() => setShowTeamsPanel(false)} className="p-2 hover:bg-white/10 rounded-lg text-neutral-team transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar">
                <Controls players={gameState.players} currentPlayer={currentPlayer} onSelectTeam={handleSelectTeam} onSelectRole={handleSelectRole} onStartGame={handleStartGame} onMovePlayer={handleMovePlayer} gameStatus={gameState.status} maxPlayers={gameState.config.maxPlayers}/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerminateConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-bg/90 backdrop-blur-xl border border-[#FF4B4B]/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(255,75,75,0.2)]">
              <Power className="w-16 h-16 text-[#FF4B4B] mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-white">¿Terminar Misión?</h3>
              <p className="text-base text-neutral-team mb-8">Todos los agentes volverán al cuartel general.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowTerminateConfirm(false)} className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                <button onClick={confirmTerminate} className="flex-1 py-4 rounded-xl bg-[#FF4B4B] text-white font-bold hover:bg-[#FF4B4B]/80 shadow-[0_0_20px_rgba(255,75,75,0.4)] transition-all">Terminar</button>
              </div>
            </motion.div>
          </div>
        )}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-bg/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <LogOut className="w-16 h-16 text-neutral-team mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-white">¿Abandonar Sala?</h3>
              <p className="text-base text-neutral-team mb-8">Saldrás de este cuartel y perderás tu puesto.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all">Cancelar</button>
                <button onClick={confirmLeave} className="flex-1 py-4 rounded-xl bg-white text-bg font-bold hover:bg-white/90 transition-all">Abandonar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}