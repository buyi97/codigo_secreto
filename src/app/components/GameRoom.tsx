import React from "react";
import { Socket } from "socket.io-client";
import { GameState, Player, Team, Role, PlayerTeam } from "../lib/gameLogic";
import Board from "./Board";
import Controls from "./Controls";
import ClueInput from "./ClueInput";
import ClueHistory from "./ClueHistory";
import Settings from "./Settings";
import { LogOut, Settings as SettingsIcon, Trophy, Clock, Users, Copy, Check, Power, Menu, X } from "lucide-react";
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
  const [showTeamsPanel, setShowTeamsPanel] = React.useState(false);

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
  
  const effectiveIsSpymaster = isSinglePlayer ? !gameState.currentClue : (currentPlayer?.role === "spymaster");
  const isSpymaster = currentPlayer?.role === "spymaster";

  const canGiveClue = (effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !gameState.currentClue;
  const canClick = (!effectiveIsSpymaster || isSinglePlayer) && isMyTurn && gameState.status === "playing" && !!gameState.currentClue;
  const isHost = currentPlayer?.isHost;

  const isCriticalTime = gameState.status === "playing" && gameState.timer > 0 && gameState.timer <= 10 && !gameState.isUltimatum;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg relative">
      {/* Header */}
      <header className="h-16 md:h-20 px-4 md:px-6 flex items-center justify-between bg-black/60 border-b border-white/10 shrink-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-6">
          {/* Scores */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#FF4B4B]/15 border border-[#FF4B4B]/40 min-w-[50px] md:min-w-[70px]">
              <span className="text-base md:text-2xl font-black text-[#FF4B4B]">{redRemaining}/{redTotal}</span>
            </div>
            <div className="flex flex-col items-center px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-[#4B9FFF]/15 border border-[#4B9FFF]/40 min-w-[50px] md:min-w-[70px]">
              <span className="text-base md:text-2xl font-black text-[#4B9FFF]">{blueRemaining}/{blueTotal}</span>
            </div>
          </div>
          
          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
            gameState.isUltimatum ? "bg-[#FF4B4B]/20 border-[#FF4B4B] animate-pulse" : 
            (isCriticalTime ? "bg-[#FF4B4B]/80 border-[#FF4B4B] shadow-[0_0_20px_rgba(255,75,75,0.5)]" : "bg-black/40 border-white/10")
          )}>
            <Clock className={cn("w-4 h-4", (gameState.isUltimatum || isCriticalTime) ? "text-white" : "text-amber-400")} />
            <div className="flex flex-col items-center leading-none">
              {(gameState.isUltimatum || isCriticalTime) && (
                <span className="text-[8px] font-black text-white uppercase mb-0.5">
                  {gameState.isUltimatum ? "Ultimátum" : "¡RÁPIDO!"}
                </span>
              )}
              <span className={cn(
                "font-mono text-sm md:text-xl font-bold",
                (gameState.isUltimatum || isCriticalTime) ? "text-white" : (gameState.timer < 15 && gameState.timer !== -1 ? "text-red-500 animate-pulse" : "text-amber-400")
              )}>
                {gameState.timer === -1 ? "∞" : `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </div>
        </div>

        {/* Center - Turn indicator (hidden on small screens) */}
        <div className="hidden md:flex items-center">
          <div className={cn(
            "px-6 py-2 rounded-full text-sm font-bold shadow-lg transition-all",
            gameState.turn === "red" 
              ? "bg-[#FF4B4B] text-white shadow-[#FF4B4B]/40" 
              : "bg-[#4B9FFF] text-white shadow-[#4B9FFF]/40"
          )}>
            {gameState.status === "playing" 
              ? `Turno ${gameState.turn === "red" ? "Rojo" : "Azul"}: ${gameState.currentClue ? "Eligiendo" : "Pensando"}`
              : "En Lobby"}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Room ID */}
          <div className="hidden sm:flex items-center gap-2 bg-black/60 text-white px-3 py-2 rounded-lg border border-white/10">
            <span className="text-[10px] text-neutral-team uppercase">Sala:</span>
            <span className="font-mono text-sm font-bold">{gameState.roomId}</span>
            <button 
              onClick={copyRoomLink}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-neutral-team" />}
            </button>
          </div>

          {/* Settings */}
          <button 
            disabled={gameState.status === "playing"}
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors border border-white/10",
              showSettings ? "bg-white text-bg" : "hover:bg-white/10 text-neutral-team",
              gameState.status === "playing" && "opacity-30 cursor-not-allowed"
            )}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>

          {/* Leave */}
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="p-2 hover:bg-[#FF4B4B]/20 rounded-lg transition-colors border border-white/10 group"
          >
            <LogOut className="w-5 h-5 text-neutral-team group-hover:text-[#FF4B4B]" />
          </button>
        </div>
      </header>

      {/* Main Content - New Layout: Board + Clues always visible, Teams in slide-out */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Left: Board (main focus) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {gameState.status === "lobby" ? (
            <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-center bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md p-8">
              <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-[#4B9FFF]" />
              </div>
              <h2 className="text-2xl font-bold">Esperando jugadores...</h2>
              <p className="text-sm text-neutral-team max-w-xs">
                Configura los equipos y roles antes de comenzar.
              </p>
              {isHost && (
                <button 
                  onClick={handleStartGame}
                  className="mt-4 bg-[#4B9FFF] hover:bg-[#4B9FFF]/80 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all"
                >
                  Comenzar Juego
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-full p-2 flex items-center justify-center">
              <div className="w-full max-w-4xl aspect-square">
                <Board 
                  cards={gameState.cards} 
                  isSpymaster={effectiveIsSpymaster} 
                  onCardClick={handleCardClick}
                  canClick={canClick}
                />
              </div>
            </div>
          )}

          {/* Game End Overlay */}
          <AnimatePresence>
            {gameState.status === "ended" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 text-center shadow-2xl max-w-md w-full">
                  <Trophy className={`w-20 h-20 mx-auto mb-6 ${gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]"}`} />
                  <h2 className="text-3xl font-black mb-2 uppercase">¡Victoria!</h2>
                  <p className="text-base text-neutral-team mb-8">
                    El equipo <span className={`font-bold ${gameState.winner === "red" ? "text-[#FF4B4B]" : "text-[#4B9FFF]"}`}>
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

        {/* Right: Clues Section (ALWAYS VISIBLE) */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
          {/* Clue History */}
          <div className="flex-1 min-h-0">
            <ClueHistory clues={gameState.clues} />
          </div>

          {/* Current Clue Info */}
          {gameState.status === "playing" && gameState.currentClue && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center">
              <span className="text-[10px] uppercase font-black text-neutral-team opacity-40 block mb-1">
                Palabras Restantes
              </span>
              <span className="text-xl font-black text-white">
                {gameState.guessesMade} / {gameState.currentClue.count === 0 ? "∞" : gameState.currentClue.count}
              </span>
            </div>
          )}

          {/* Clue Input */}
          {gameState.status === "playing" && (
            <ClueInput 
              onGiveClue={handleGiveClue} 
              disabled={!canGiveClue}
              isMyTurn={isMyTurn}
              isSpymaster={effectiveIsSpymaster}
              teamWordsRemaining={gameState.turn === "red" ? redRemaining : blueRemaining}
              boardWords={gameState.cards.map(c => c.word)}
            />
          )}
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-14 md:h-16 px-4 md:px-6 bg-black/60 backdrop-blur-xl flex items-center justify-between border-t border-white/10 shrink-0">
        <div className="flex items-center gap-4 text-xs text-white/90">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4B9FFF]" />
            {gameState.players.length}
          </span>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-white/60">1er Turno:</span>
            <span>{gameState.config.firstTurnMode === "unlimited" ? "∞" : `${gameState.config.firstTurnDuration}s`}</span>
            <span className="text-white/60">Turno:</span>
            <span>{gameState.config.timerDuration}s</span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Teams Button (Mobile/Tablet) */}
          <button 
            onClick={() => setShowTeamsPanel(true)}
            className="lg:hidden px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold">Equipos</span>
          </button>

          {isHost && gameState.status === "playing" && (
            <button 
              onClick={() => setShowTerminateConfirm(true)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#FF4B4B]/20 text-[#FF4B4B] border border-[#FF4B4B]/30 hover:bg-[#FF4B4B]/30 transition-all flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              <span className="hidden md:inline">Terminar</span>
            </button>
          )}

          {((!isSpymaster && isMyTurn) || (isSinglePlayer && gameState.currentClue)) && gameState.status === "playing" && (
            <button 
              onClick={handleEndTurn}
              className="bg-white text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/90 transition-all"
            >
              Pasar Turno
            </button>
          )}
        </div>
      </footer>

      {/* Teams Slide-out Panel (Desktop: sidebar, Mobile: full overlay) */}
      <AnimatePresence>
        {showTeamsPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamsPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-bg border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-bg/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-lg">Equipos</h3>
                <button 
                  onClick={() => setShowTeamsPanel(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
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

      {/* Desktop Teams Sidebar (always visible on lg+) */}
      <div className="hidden lg:block fixed left-0 top-20 bottom-16 w-72 bg-white/5 backdrop-blur-md border-r border-white/10 overflow-y-auto p-4 z-30">
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
              className="bg-white/10 backdrop-blur-xl border border-[#FF4B4B]/30 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <Power className="w-12 h-12 text-[#FF4B4B] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Terminar Partida?</h3>
              <p className="text-sm text-neutral-team mb-6">La misión actual se cancelará.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTerminateConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmTerminate}
                  className="flex-1 py-3 rounded-xl bg-[#FF4B4B] text-white font-bold hover:bg-[#FF4B4B]/80 transition-all"
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
              className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <LogOut className="w-12 h-12 text-neutral-team mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">¿Salir de la Sala?</h3>
              <p className="text-sm text-neutral-team mb-6">Perderás tu lugar en la misión actual.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
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
    </div>
  );
}