import React from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Team, Role, PlayerTeam } from "../lib/gameLogic";
import Board from "./Board";
import Controls from "./Controls";
import ClueInput from "./ClueInput";
import ClueHistory from "./ClueHistory";
import Settings from "./Settings";
import { LogOut, Settings as SettingsIcon, Trophy, Clock, Users, Copy, Check, Power } from "lucide-react";
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
  const [showSettings, setShowSettings] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);

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

  const redTotal = gameState.totalRed || gameState.cards.filter(c => c.team === "red").length;
  const redRevealed = gameState.cards.filter(c => c.team === "red" && c.revealed).length;
  const blueTotal = gameState.totalBlue || gameState.cards.filter(c => c.team === "blue").length;
  const blueRevealed = gameState.cards.filter(c => c.team === "blue" && c.revealed).length;

  const redRemaining = redTotal - redRevealed;
  const blueRemaining = blueTotal - blueRevealed;

  const isSinglePlayer = gameState.players.length === 1;
  const isMyTurn = isSinglePlayer || (currentPlayer?.team === gameState.turn);
  
  // In single player mode, spymaster is active only if no clue has been given yet for the turn
  const effectiveIsSpymaster = isSinglePlayer ? !gameState.currentClue : (currentPlayer?.role === "spymaster");
  const isSpymaster = currentPlayer?.role === "spymaster";

  const canGiveClue = (effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !gameState.currentClue;
  const canClick = (!effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !!gameState.currentClue;
  const isHost = currentPlayer?.isHost;

  const isCriticalTime = gameState.status === "playing" && gameState.timer > 0 && gameState.timer <= 10 && !gameState.isUltimatum;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg relative">
      {/* Header */}
      <header className="h-16 md:h-20 px-4 md:px-10 flex items-center justify-between bg-black/40 border-b border-glass-border shrink-0 z-10">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-1 md:gap-4">
            <div className="flex flex-col items-center px-2 md:px-4 py-1 md:py-2 rounded-lg bg-red-team/15 border border-red-team/40 min-w-[50px] md:min-w-[80px]">
              <span className="text-base md:text-2xl font-black text-red-team">{redRemaining}/{redTotal}</span>
            </div>
            <div className="flex flex-col items-center px-2 md:px-4 py-1 md:py-2 rounded-lg bg-blue-team/15 border border-blue-team/40 min-w-[50px] md:min-w-[80px]">
              <span className="text-base md:text-2xl font-black text-blue-team">{blueRemaining}/{blueTotal}</span>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-xl border transition-all z-50",
            gameState.isUltimatum ? "bg-red-team/20 border-red-team animate-pulse" : 
            (isCriticalTime ? "bg-red-team/80 border-red-team shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-slate-900/50 border-glass-border")
          )}>
            <Clock className={cn("w-3.5 h-3.5 md:w-4 md:h-4", (gameState.isUltimatum || isCriticalTime) ? "text-white" : "text-amber-400")} />
            <div className="flex flex-col items-center leading-none">
              {(gameState.isUltimatum || isCriticalTime) && <span className="text-[7px] md:text-[8px] font-black text-white uppercase mb-0.5">{gameState.isUltimatum ? "Ultimátum" : "¡RÁPIDO!"}</span>}
              <span className={cn(
                "font-mono text-sm md:text-xl font-bold",
                (gameState.isUltimatum || isCriticalTime) ? "text-white" : (gameState.timer < 15 && gameState.timer !== -1 ? "text-red-500 animate-pulse" : "text-amber-400")
              )}>
                {gameState.timer === -1 ? "∞" : `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-8">
          <div className={cn(
            "px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-all duration-500",
            gameState.turn === "red" 
              ? "bg-red-team text-white shadow-red-team/40" 
              : "bg-blue-team text-white shadow-blue-team/40"
          )}>
            {gameState.status === "playing" 
              ? `Turno Equipo ${gameState.turn === "red" ? "Rojo" : "Azul"}: ${gameState.currentClue ? "Eligiendo" : "Pensando Pista"}`
              : "Misión Finalizada"}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1 drop-shadow-md">Historial</span>
            <div className="flex items-center gap-4 bg-white/10 px-5 py-2 rounded-xl border border-white/20 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col items-center relative z-10">
                <span className={cn(
                  "text-xl font-black transition-all duration-500", 
                  gameState.history.red > gameState.history.blue 
                    ? "text-white scale-125 drop-shadow-[0_0_15px_rgba(244,63,94,1)]" 
                    : "text-red-team drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]"
                )}>
                  {gameState.history.red}
                </span>
              </div>
              <div className="w-px h-7 bg-white/20 relative z-10" />
              <div className="flex flex-col items-center relative z-10">
                <span className={cn(
                  "text-xl font-black transition-all duration-500", 
                  gameState.history.blue > gameState.history.red 
                    ? "text-white scale-125 drop-shadow-[0_0_15px_rgba(56,189,248,1)]" 
                    : "text-blue-team drop-shadow-[0_0_5px_rgba(56,189,248,0.3)]"
                )}>
                  {gameState.history.blue}
                </span>
              </div>
              {/* Discrete winner indicator */}
              {gameState.history.red !== gameState.history.blue && (
                <motion.div 
                  layoutId="winner-indicator"
                  className={cn(
                    "absolute inset-0 opacity-30",
                    gameState.history.red > gameState.history.blue ? "bg-red-team" : "bg-blue-team"
                  )}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold">
            <span className="text-[10px] text-neutral-team uppercase mr-1">Sala:</span>
            <span className="font-mono">{gameState.roomId}</span>
            <button 
              onClick={copyRoomLink}
              className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
              title="Copiar enlace de sala"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-neutral-team" />}
            </button>
          </div>
          <div className="flex gap-1 md:gap-2">
            <div className="relative group">
              <button 
                disabled={gameState.status === "playing"}
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-lg transition-colors border border-glass-border",
                  showSettings ? "bg-white text-bg" : "hover:bg-white/10 text-neutral-team",
                  gameState.status === "playing" && "opacity-30 cursor-not-allowed grayscale"
                )}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              {gameState.status === "playing" && (
                <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-black/90 border border-glass-border rounded-lg text-[10px] text-white font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100]">
                  No se puede cambiar la configuración durante la partida
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-team/20 rounded-lg transition-colors border border-glass-border group"
              title="Salir de la sala"
            >
              <LogOut className="w-5 h-5 text-neutral-team group-hover:text-red-team" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[240px_1fr_280px] xl:grid-cols-[280px_1fr_320px] gap-4 p-4 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        {/* Left Sidebar: Players */}
        <aside className="hidden lg:flex sidebar glass-panel flex-col gap-4 p-4 overflow-hidden">
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
        </aside>

        {/* Center: Board */}
        <section className="flex-1 flex flex-col items-center justify-center overflow-hidden min-h-0">
          <div className="w-full h-full max-w-[90vh] aspect-square relative flex items-center justify-center">
            {gameState.status === "lobby" ? (
              <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-center glass-panel">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-3xl border border-glass-border flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 md:w-12 md:h-12 text-blue-team fill-blue-team" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">Esperando a los jugadores...</h2>
                <p className="text-xs md:text-sm text-neutral-team max-w-xs px-4">Configura los equipos y roles antes de comenzar la misión.</p>
                {isHost && (
                  <button 
                    onClick={handleStartGame}
                    className="mt-4 bg-blue-team hover:bg-blue-team/80 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-team/30 transition-all"
                  >
                    Comenzar Juego
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full h-full p-2">
                <Board 
                  cards={gameState.cards} 
                  isSpymaster={effectiveIsSpymaster} 
                  onCardClick={handleCardClick}
                  canClick={canClick}
                />
              </div>
            )}

            <AnimatePresence>
              {gameState.status === "ended" && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 rounded-2xl"
                >
                  <div className="glass-panel p-6 md:p-10 text-center shadow-2xl max-w-sm w-full">
                    <Trophy className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 ${gameState.winner === "red" ? "text-red-team" : "text-blue-team"}`} />
                    <h2 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight">
                      ¡Victoria!
                    </h2>
                    <p className="text-sm md:text-base text-neutral-team mb-8">
                      El equipo <span className={`font-bold ${gameState.winner === "red" ? "text-red-team" : "text-blue-team"}`}>
                        {gameState.winner === "red" ? "Rojo" : "Azul"}
                      </span> ha completado la misión.
                    </p>
                    {isHost && (
                      <button 
                        onClick={confirmTerminate}
                        className="w-full bg-white text-bg py-4 rounded-xl font-bold hover:bg-white/90 transition-all"
                      >
                        Volver al Menú
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Sidebar: History, Clues */}
        <aside className="hidden lg:flex sidebar glass-panel flex-col gap-4 p-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <ClueHistory clues={gameState.clues} />
            
            {gameState.status === "playing" && (
              <div className="mt-auto space-y-4">
                {gameState.currentClue && (
                  <div className="p-3 bg-white/5 border border-glass-border rounded-xl text-center">
                    <span className="text-[10px] uppercase font-black text-neutral-team opacity-40 block mb-1">Palabras Restantes</span>
                    <span className="text-xl font-black text-white">
                      {gameState.guessesMade} / {gameState.currentClue.count === 0 ? "∞" : gameState.currentClue.count}
                    </span>
                  </div>
                )}
                <ClueInput 
                  onGiveClue={handleGiveClue} 
                  disabled={!canGiveClue}
                  isMyTurn={isMyTurn}
                  isSpymaster={effectiveIsSpymaster}
                  teamWordsRemaining={gameState.turn === "red" ? redRemaining : blueRemaining}
                  boardWords={gameState.cards.map(c => c.word)}
                />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-[60px] md:h-[70px] px-4 md:px-10 bg-black/40 flex items-center justify-between border-t border-glass-border shrink-0">
        <div className="flex items-center gap-4 text-[9px] md:text-xs text-white/90">
          <span className="flex items-center gap-2 font-bold">
            <Users className="w-4 h-4 text-blue-team" />
            {gameState.players.length} <span className="hidden sm:inline">Jugadores</span>
          </span>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <div className="flex items-center gap-3 font-bold">
            <span className="text-white/60 uppercase tracking-tighter font-black">Configuración:</span>
            <div className="flex items-center gap-1">
              <span className="text-white/60">1er Turno:</span>
              <span className="text-white">{gameState.config.firstTurnMode === "unlimited" ? "∞" : `${gameState.config.firstTurnDuration}s`}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white/60">Turno:</span>
              <span className="text-white">{gameState.config.timerDuration}s</span>
            </div>
            {gameState.config.limitGuesses && <span className="text-blue-team font-black uppercase tracking-tighter text-[9px] md:text-[10px] bg-blue-team/10 px-2 py-0.5 rounded border border-blue-team/20">Límite n+1</span>}
          </div>
        </div>

        <div className="flex gap-2 md:gap-3">
          {isHost && gameState.status === "playing" && (
            <button 
              onClick={() => setShowTerminateConfirm(true)}
              className="px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold bg-red-team/20 text-red-team border border-red-team/30 hover:bg-red-team/30 transition-all flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              Terminar Partida
            </button>
          )}
          {((!isSpymaster && isMyTurn) || (isSinglePlayer && gameState.currentClue)) && gameState.status === "playing" && (
            <button 
              onClick={handleEndTurn}
              className="bg-white text-bg px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-white/90 transition-all"
            >
              Pasar Turno
            </button>
          )}
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showSettings && (
          <Settings 
            config={gameState.config}
            onUpdate={handleUpdateConfig}
            onClose={() => setShowSettings(false)}
            isHost={isHost || false}
          />
        )}

        {showTerminateConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-8 max-w-sm w-full text-center border border-red-team/30"
            >
              <Power className="w-12 h-12 text-red-team mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Terminar Partida?</h3>
              <p className="text-sm text-neutral-team mb-6">La misión actual se cancelará y volverán al menú de la sala.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTerminateConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-glass-border font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmTerminate}
                  className="flex-1 py-3 rounded-xl bg-red-team text-white font-bold hover:bg-red-team/80 transition-all"
                >
                  Confirmar
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
              className="glass-panel p-8 max-w-sm w-full text-center border border-glass-border"
            >
              <LogOut className="w-12 h-12 text-neutral-team mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Salir de la Sala?</h3>
              <p className="text-sm text-neutral-team mb-6">Perderás tu lugar en la misión actual.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-glass-border font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl bg-white text-bg font-bold hover:bg-white/90 transition-all"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Critical Timer Overlay - REMOVED */}
    </div>
  );
}

function Play(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
