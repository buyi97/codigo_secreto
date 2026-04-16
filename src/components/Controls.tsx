import React from "react";
import { Player, PlayerTeam, Role } from "../lib/gameLogic";
import { User, Shield, Users, Crown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ControlsProps {
  players: Player[];
  currentPlayer?: Player;
  onSelectTeam: (team: PlayerTeam) => void;
  onSelectRole: (role: Role) => void;
  onStartGame: () => void;
  onMovePlayer: (playerId: string, team?: PlayerTeam, role?: Role) => void;
  gameStatus: string;
  maxPlayers?: number;
}

export default function Controls({ 
  players, 
  currentPlayer, 
  onSelectTeam, 
  onSelectRole, 
  onStartGame,
  onMovePlayer,
  gameStatus,
  maxPlayers = 8
}: ControlsProps) {
  const redPlayers = players.filter(p => p.team === "red");
  const bluePlayers = players.filter(p => p.team === "blue");
  const spectators = players.filter(p => p.team === "spectator");
  const isHost = currentPlayer?.isHost;

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-team" />
          <h3 className="font-bold text-xs uppercase tracking-widest text-neutral-team">Agentes en Campo</h3>
        </div>
        <span className="text-[10px] text-neutral-team opacity-50">{players.length}/{maxPlayers}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {/* Red Team */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase bg-red-team/10 border border-red-team/20 text-red-team shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="tracking-widest">Equipo Rojo</span>
              {gameStatus !== "playing" && currentPlayer?.team !== "red" && (
                <button 
                  onClick={() => onSelectTeam("red")}
                  className="px-3 py-1 bg-red-team text-white rounded-lg text-[9px] md:text-[10px] hover:bg-red-team/80 transition-all font-black shadow-lg shadow-red-team/20 active:scale-95"
                >
                  UNIRSE
                </button>
              )}
            </div>
            <span className="opacity-60 text-xs">{redPlayers.length}</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {redPlayers.map(p => (
              <PlayerRow 
                key={p.id} 
                player={p} 
                isMe={p.id === currentPlayer?.id} 
                isHost={isHost || false}
                onSelectRole={onSelectRole}
                onMovePlayer={onMovePlayer}
                gameStatus={gameStatus}
              />
            ))}
          </div>
        </div>

        {/* Blue Team */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase bg-blue-team/10 border border-blue-team/20 text-blue-team shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="tracking-widest">Equipo Azul</span>
              {gameStatus !== "playing" && currentPlayer?.team !== "blue" && (
                <button 
                  onClick={() => onSelectTeam("blue")}
                  className="px-3 py-1 bg-blue-team text-white rounded-lg text-[9px] md:text-[10px] hover:bg-blue-team/80 transition-all font-black shadow-lg shadow-blue-team/20 active:scale-95"
                >
                  UNIRSE
                </button>
              )}
            </div>
            <span className="opacity-60 text-xs">{bluePlayers.length}</span>
          </div>
          <div className="space-y-1.5 pl-1">
            {bluePlayers.map(p => (
              <PlayerRow 
                key={p.id} 
                player={p} 
                isMe={p.id === currentPlayer?.id} 
                isHost={isHost || false}
                onSelectRole={onSelectRole}
                onMovePlayer={onMovePlayer}
                gameStatus={gameStatus}
              />
            ))}
          </div>
        </div>

        {/* Spectators */}
        {spectators.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase bg-white/5 border border-white/10 text-neutral-team">
              <div className="flex items-center gap-2">
                <span>Espectadores</span>
                {gameStatus !== "playing" && currentPlayer?.team !== "spectator" && (
                  <button 
                    onClick={() => onSelectTeam("spectator")}
                    className="px-2 py-0.5 bg-white/10 text-white rounded text-[8px] hover:bg-white/20 transition-all"
                  >
                    Unirse
                  </button>
                )}
              </div>
              <span className="opacity-50">{spectators.length}</span>
            </div>
            <div className="space-y-1 pl-2">
              {spectators.map(p => (
                <div key={p.id} className="flex items-center justify-between py-1 group">
                  <div className="flex items-center gap-2 text-xs text-neutral-team">
                    <User className="w-3 h-3 opacity-50" />
                    <span className={cn(p.id === currentPlayer?.id && "font-bold underline underline-offset-2")}>
                      {p.name} {p.id === currentPlayer?.id && "(Tú)"}
                    </span>
                  </div>
                  {isHost && gameStatus !== "playing" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onMovePlayer(p.id, "red")}
                        className="text-[10px] uppercase font-bold text-red-team/60 hover:text-red-team"
                      >
                        Rojo
                      </button>
                      <button 
                        onClick={() => onMovePlayer(p.id, "blue")}
                        className="text-[10px] uppercase font-bold text-blue-team/60 hover:text-blue-team"
                      >
                        Azul
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {gameStatus === "lobby" && currentPlayer?.isHost && (
        <button 
          onClick={onStartGame}
          className="mt-2 w-full bg-white text-bg py-3 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg uppercase tracking-widest text-xs"
        >
          Iniciar Misión
        </button>
      )}
    </div>
  );
}

const PlayerRow: React.FC<{ 
  player: Player, 
  isMe: boolean, 
  isHost: boolean,
  onSelectRole: (role: Role) => void,
  onMovePlayer: (playerId: string, team?: PlayerTeam, role?: Role) => void,
  gameStatus: string
}> = ({ player, isMe, isHost, onSelectRole, onMovePlayer, gameStatus }) => {
  const canChange = gameStatus !== "playing";

  return (
    <div className="flex items-center justify-between group py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-text-main truncate pr-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", player.team === "red" ? "bg-red-team shadow-[0_0_8px_rgba(244,63,94,0.4)]" : "bg-blue-team shadow-[0_0_8px_rgba(56,189,248,0.4)]")}></span>
        <span className={cn("truncate tracking-tight", isMe && "text-white underline underline-offset-4 decoration-2 decoration-blue-team")}>
          {player.name}
        </span>
        {player.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn(
          "text-[9px] md:text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md border",
          player.role === "spymaster" 
            ? "text-amber-400 bg-amber-400/10 border-amber-400/20" 
            : "text-neutral-team/60 bg-white/5 border-white/5"
        )}>
          {player.role === "spymaster" ? "LÍDER" : "AGENTE"}
        </span>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isMe && canChange && (
            <button 
              onClick={() => onSelectRole(player.role === "operative" ? "spymaster" : "operative")}
              className="text-[10px] uppercase font-bold text-blue-team hover:text-blue-team/80 transition-colors"
            >
              Cambiar Rol
            </button>
          )}
          {isHost && canChange && !isMe && (
            <>
              <button 
                onClick={() => onMovePlayer(player.id, player.team === "red" ? "blue" : "red")}
                className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition-colors"
                title="Cambiar Equipo"
              >
                Equipo
              </button>
              <button 
                onClick={() => onMovePlayer(player.id, undefined, player.role === "operative" ? "spymaster" : "operative")}
                className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition-colors"
                title="Cambiar Rol"
              >
                Rol
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
