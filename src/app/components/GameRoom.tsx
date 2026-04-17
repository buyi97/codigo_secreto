import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Role, PlayerTeam } from "../lib/gameLogic";
import Board from "./Board";
import Controls from "./Controls";
import ClueInput from "./ClueInput";
import ClueHistory from "./ClueHistory";
import Settings from "./Settings";
import { LogOut, Trophy, Users, Copy, Check, Power, X, RotateCcw, BookOpen } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTeamsPanel, setShowTeamsPanel] = useState(false);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false); 
  
  // MAGIA UX: Vista local del lobby
  const [localLobbyView, setLocalLobbyView] = useState(false);

  // Si arranca la partida, forzamos a TODOS a salir de la vista de Lobby
  useEffect(() => {
    if (gameState.status === "playing") {
      setLocalLobbyView(false);
    }
  }, [gameState.status]);

  const effectiveStatus = localLobbyView ? "lobby" : gameState.status;

  const handleVolverAlCuartel = () => {
    // Al tocar el botón final, TODOS aplican vista de Lobby local. 
    // El servidor mantiene el estado "ended" hasta que el líder apriete "Iniciar Partida".
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
      alert("⚠️ Has seleccionado usar un Nuevo Banco de Palabras, pero no tienes el mínimo de 25 palabras necesarias.");
      return;
    }
    if (gameState.players.length > 1) {
      const redSpymaster = gameState.players.find(p => p.team === "red" && p.role === "spymaster");
      const blueSpymaster = gameState.players.find(p => p.team === "blue" && p.role === "spymaster");
      if (!redSpymaster || !blueSpymaster) {
        alert("Cada equipo debe tener un Líder (Spymaster) asignado antes de comenzar.");
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
    const url = window.location.origin + "?room=" + gameState.roomId;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const turnPhase = gameState.currentClue ? "ELECCIÓN" : "PISTA";
  const turnTeamName = gameState.turn === "red" ? "ROJO" : "AZUL";
  const turnTeamColor = gameState.turn === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]";

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-bg relative">
      
      <header className="w-full flex flex-col md:flex-row md:items-center justify-between bg-black/90 border-b border-white/10 shrink-0 z-20 backdrop-blur-2xl shadow-lg p-2 md:px-6 md:h-20 gap-2">
        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-2 shrink-0">
          <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-neutral-team font-black mr-1">Historial</span>
            <span className={cn("font-black transition-all", redWins > blueWins ? "text-lg text-[#FF4B4B]" : "text-sm text-[#FF4B4B]/70")}>{redWins}</span>
            <span className="text-white/20 text-xs mx-1">-</span>
            <span className={cn("font-black transition-all", blueWins > redWins ? "text-lg text-[#4B9FFF]" : "text-sm text-[#4B9FFF]/70")}>{blueWins}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-black/50 text-white px-2 py-1.5 md:py-2 rounded-xl border border-white/10">
            <span className="text-[10px] text-neutral-team uppercase font-bold">Sala</span>
            <span className="font-mono text-sm font-bold text-primary">{gameState.roomId}</span>
            <button onClick={copyRoomLink} className="p-1 hover:bg-white/10 rounded transition-colors ml-1">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-neutral-team" />}
            </button>
          </div>
        </div>

        {effectiveStatus !== "lobby" && (
          <div className="flex items-center justify-between md:justify-center w-full md:flex-1 gap-2 md:gap-8">
            <div className="flex items-baseline gap-0.5 md:gap-1 px-3 py-1.5 rounded-lg bg-[#FF4B4B]/10 border border-[#FF4B4B]/30 shadow-inner">
              <span className="text-lg md:text-2xl font-black text-[#FF4B4B] leading-none">{redRemaining}</span>
              <span className="text-[10px] md:text-xs font-bold text-[#FF4B4B]/60 leading-none">/{redTotal}</span>
            </div>

            <div className="flex flex-col items-center justify-center -mt-1 md:mt-0">
              <div className="text-[10px] md:text-sm font-black uppercase tracking-widest leading-none mb-1">
                {/* CAMBIADO: status === "ended" en lugar de "finished" */}
                {gameState.status === "ended" ? (
                  <span className="text-green-400">Misión Finalizada</span>
                ) : (
                  <span>TURNO {turnPhase} <span className={turnTeamColor}>{turnTeamName}</span></span>
                )}
              </div>
              <div className={cn(
                "px-4 py-0.5 rounded-md border font-mono text-sm md:text-lg font-bold transition-all shadow-md leading-tight",
                gameState.isUltimatum ? "bg-[#FF4B4B]/30 border-[#FF4B4B] animate-pulse" : 
                (isCriticalTime ? "bg-[#FF4B4B]/80 border-[#FF4B4B]" : "bg-black/40 border-white/10 text-amber-400")
              )}>
                {gameState.timer === -1 ? "∞" : `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`}
              </div>
            </div>

            <div className="flex items-baseline gap-0.5 md:gap-1 px-3 py-1.5 rounded-lg bg-[#4B9FFF]/10 border border-[#4B9FFF]/30 shadow-inner">
              <span className="text-lg md:text-2xl font-black text-[#4B9FFF] leading-none">{blueRemaining}</span>
              <span className="text-[10px] md:text-xs font-bold text-[#4B9FFF]/60 leading-none">/{blueTotal}</span>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center justify-end w-full md:w-auto gap-3 shrink-0">
          {gameState.status === "playing" && (
             <button onClick={() => setShowTeamsPanel(true)} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-all">
               <Users className="w-5 h-5" /> <span className="text-sm font-bold">Equipos</span>
             </button>
          )}
          <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-[#FF4B4B]/20 rounded-xl transition-colors border border-white/20 group">
            <LogOut className="w-5 h-5 text-neutral-team group-hover:text-[#FF4B4B]" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {effectiveStatus === "lobby" && (
          <div className="flex-1 overflow-y-auto p-3 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full flex flex-col xl:grid xl:grid-cols-2 gap-4 md:gap-8 items-start">
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col w-full h-[500px] xl:h-[calc(100vh-140px)]">
                 <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                    <h2 className="text-xl md:text-2xl font-black uppercase text-white flex items-center gap-2">
                      <Users className="text-primary" /> Agentes
                    </h2>
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <Controls players={gameState.players} currentPlayer={currentPlayer} onSelectTeam={handleSelectTeam} onSelectRole={handleSelectRole} onStartGame={handleStartGame} onMovePlayer={handleMovePlayer} gameStatus={gameState.status} maxPlayers={gameState.config.maxPlayers} />
                 </div>
                 {isHost && (
                   <button onClick={handleStartGame} className="mt-4 w-full py-4 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-black text-lg md:text-xl rounded-xl shadow-[0_0_20px_rgba(75,159,255,0.4)] transform hover:scale-[1.02] transition-all shrink-0">
                     INICIAR PARTIDA
                   </button>
                 )}
              </div>

              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-2xl w-full min-h-[600px] xl:h-[calc(100vh-140px)] flex flex-col">
                 <Settings config={gameState.config} onUpdate={handleUpdateConfig} onClose={() => {}} isHost={currentPlayer?.isHost || false} />
              </div>
            </div>
          </div>
        )}

        {effectiveStatus !== "lobby" && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0 w-full relative">
             
             <div className="flex-1 flex flex-col min-w-0 min-h-0 relative p-1 md:p-4">
                <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
                   {/* CAMBIADO: status === "ended" en lugar de "finished" */}
                   <div className={cn(
                     "w-full h-full max-w-6xl max-h-[800px] flex transition-opacity duration-700 mx-auto",
                     gameState.status === "ended" ? "opacity-30 pointer-events-none grayscale-[40%]" : "opacity-100"
                   )}>
                     <Board cards={gameState.cards} isSpymaster={effectiveIsSpymaster} onCardClick={handleCardClick} canClick={canClick} />
                   </div>
                </div>
             </div>

             {/* LA BARRA INFERIOR (Ocupa la misma posición y se transforma al terminar) */}
             {/* CAMBIADO: status === "ended" en lugar de "finished" */}
             {(gameState.status === "playing" || gameState.status === "ended") && (
                <div className="absolute inset-x-0 bottom-0 shrink-0 p-3 md:p-4 bg-bg/95 backdrop-blur-xl border-t border-white/10 flex flex-wrap items-center justify-center gap-3 md:gap-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
                  {gameState.status === "playing" ? (
                    <>
                      {isHost && (
                        <button onClick={() => setShowTerminateConfirm(true)} className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-xs md:text-sm font-bold bg-[#FF4B4B]/10 text-[#FF4B4B] border border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/20 transition-all flex items-center gap-2">
                          <Power className="w-4 h-4" /> <span className="hidden sm:inline">Terminar</span>
                        </button>
                      )}
                      
                      {((!isSpymaster && isMyTurn) || (isSinglePlayer && gameState.currentClue)) && (
                        <button onClick={handleEndTurn} className="flex-1 max-w-[300px] md:w-auto bg-white text-bg px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-sm font-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all uppercase tracking-widest">
                          Pasar Turno
                        </button>
                      )}
                      
                      <button onClick={() => setShowHistoryMobile(true)} className="lg:hidden px-4 py-2.5 rounded-xl text-xs font-bold bg-[#4B9FFF]/10 text-[#4B9FFF] border border-[#4B9FFF]/30 hover:bg-[#4B9FFF]/20 transition-all flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Pistas
                      </button>
                    </>
                  ) : (
                    // === ACA ESTÁ EL BOTÓN PARA TODOS AL TERMINAR ===
                    <button onClick={handleVolverAlCuartel} className="w-full md:w-auto py-3 px-8 bg-primary hover:bg-primary-hover text-white font-black rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(75,159,255,0.4)]">
                        <RotateCcw className="w-5 h-5" /> Volver al lobby de sala
                    </button>
                  )}
                </div>
             )}

             {/* Banner central solo con el texto de quién ganó */}
             {/* CAMBIADO: status === "ended" en lugar de "finished" */}
             {gameState.status === "ended" && (
                <div className="absolute inset-0 flex items-center justify-center z-10 p-4 pointer-events-none">
                   <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-black/80 backdrop-blur-md border border-white/20 p-6 md:p-12 rounded-3xl text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center">
                      <Trophy className={cn("w-16 h-16 md:w-20 md:h-20 mb-4", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")} />
                      <h2 className="text-3xl md:text-4xl font-black uppercase text-white mb-2 leading-none">Misión<br/>Completada</h2>
                      <p className={cn("text-xl md:text-2xl font-bold", gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]")}>
                          ¡Ganó el Equipo {gameState.winner === "red" ? "Rojo" : "Azul"}!
                      </p>
                   </motion.div>
                </div>
             )}

             {/* SIDEBAR */}
             <aside className={cn(
                "w-full lg:w-80 xl:w-96 shrink-0 flex flex-col bg-bg-dark border-t lg:border-t-0 lg:border-l border-white/10 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] lg:shadow-none transition-all",
                "fixed inset-x-0 bottom-0 top-[15vh] lg:static lg:translate-y-0",
                showHistoryMobile ? "translate-y-0" : "translate-y-full lg:translate-y-0",
                // CAMBIADO: status === "ended" en lugar de "finished"
                gameState.status === "ended" && "hidden lg:flex opacity-30 pointer-events-none" 
             )}>
                <div className="lg:hidden p-4 bg-black border-b border-white/10 flex justify-between items-center shrink-0">
                   <h3 className="font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                     <BookOpen className="w-4 h-4" /> Inteligencia
                   </h3>
                   <button onClick={() => setShowHistoryMobile(false)} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition">
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="hidden lg:block p-4 border-b border-white/10 bg-black/20 shrink-0">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-team text-center">Registro de Inteligencia</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 lg:p-4 custom-scrollbar bg-black/20 min-h-0">
                  <ClueHistory clues={gameState.clues || []} />
                </div>

                {gameState.currentClue && gameState.status === "playing" && (
                  <div className="shrink-0 p-2 lg:p-4 bg-black/40 border-t border-white/10 flex items-center justify-center gap-4 shadow-inner">
                    <span className="hidden md:inline text-xs uppercase font-bold text-neutral-team">Pista Activa:</span>
                    <div className="bg-white/10 px-3 py-1 rounded-lg font-black text-white text-lg">
                      {gameState.currentClue.word} <span className="text-primary ml-1">({gameState.currentClue.count})</span>
                    </div>
                    <div className="text-center ml-2">
                      <span className="text-[10px] uppercase text-neutral-team block leading-none">Adivinadas</span>
                      <span className="font-bold text-white">{gameState.guessesMade} / {gameState.currentClue.count === 0 ? "∞" : gameState.currentClue.count}</span>
                    </div>
                  </div>
                )}

                {gameState.status === "playing" && (
                  <div className="shrink-0 p-2 lg:p-4 bg-bg border-t border-white/10">
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

      {/* Modales extras */}
      <AnimatePresence>
        {showTeamsPanel && gameState.status === "playing" && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamsPanel(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-bg/95 backdrop-blur-2xl border-r border-white/20 z-50 flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg text-white flex items-center gap-2"><Users className="text-primary"/> Agentes</h3>
                <button onClick={() => setShowTeamsPanel(false)} className="p-2 hover:bg-white/10 rounded-lg text-neutral-team transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <Controls players={gameState.players} currentPlayer={currentPlayer} onSelectTeam={handleSelectTeam} onSelectRole={handleSelectRole} onStartGame={handleStartGame} onMovePlayer={handleMovePlayer} gameStatus={gameState.status} maxPlayers={gameState.config.maxPlayers}/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerminateConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-bg/90 backdrop-blur-xl border border-[#FF4B4B]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,75,75,0.2)]">
              <Power className="w-12 h-12 text-[#FF4B4B] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">¿Terminar Misión?</h3>
              <p className="text-sm text-neutral-team mb-6">Todos volverán al cuartel general.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowTerminateConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5">Cancelar</button>
                <button onClick={confirmTerminate} className="flex-1 py-3 rounded-xl bg-[#FF4B4B] text-white font-bold hover:bg-[#FF4B4B]/80 shadow-[0_0_15px_rgba(255,75,75,0.4)]">Terminar</button>
              </div>
            </motion.div>
          </div>
        )}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-bg/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
              <LogOut className="w-12 h-12 text-neutral-team mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">¿Abandonar Sala?</h3>
              <p className="text-sm text-neutral-team mb-6">Saldrás de este cuartel y perderás tu puesto.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5">Cancelar</button>
                <button onClick={confirmLeave} className="flex-1 py-3 rounded-xl bg-white text-bg font-bold hover:bg-white/90">Abandonar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}