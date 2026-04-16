import React, { useState } from "react";
import { GameState } from "../lib/gameLogic";
import { X, Clock, Infinity, Users } from "lucide-react";
import { motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsProps {
  config: GameState["config"];
  onUpdate: (config: Partial<GameState["config"]>) => void;
  onClose: () => void;
  isHost: boolean;
}

export default function Settings({ config, onUpdate, onClose, isHost }: SettingsProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onUpdate(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase">Configuración</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="space-y-6">
          {/* Timer Duration */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-team flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duración del Turno (segundos)
            </label>
            <input
              type="number"
              value={localConfig.timerDuration}
              onChange={(e) => setLocalConfig({ ...localConfig, timerDuration: parseInt(e.target.value) })}
              disabled={!isHost}
              min={10}
              max={300}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4B9FFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* First Turn Mode */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-team flex items-center gap-2">
              <Infinity className="w-4 h-4" />
              Modo Primer Turno
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalConfig({ ...localConfig, firstTurnMode: "timed" })}
                disabled={!isHost}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all",
                  localConfig.firstTurnMode === "timed"
                    ? "bg-[#4B9FFF] text-white"
                    : "bg-white/5 text-neutral-team hover:bg-white/10",
                  !isHost && "opacity-50 cursor-not-allowed"
                )}
              >
                Limitado
              </button>
              <button
                onClick={() => setLocalConfig({ ...localConfig, firstTurnMode: "unlimited" })}
                disabled={!isHost}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all",
                  localConfig.firstTurnMode === "unlimited"
                    ? "bg-[#4B9FFF] text-white"
                    : "bg-white/5 text-neutral-team hover:bg-white/10",
                  !isHost && "opacity-50 cursor-not-allowed"
                )}
              >
                Ilimitado
              </button>
            </div>
          </div>

          {/* First Turn Duration (if timed) */}
          {localConfig.firstTurnMode === "timed" && (
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-neutral-team">
                Duración 1er Turno (segundos)
              </label>
              <input
                type="number"
                value={localConfig.firstTurnDuration}
                onChange={(e) => setLocalConfig({ ...localConfig, firstTurnDuration: parseInt(e.target.value) })}
                disabled={!isHost}
                min={10}
                max={300}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4B9FFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Limit Guesses */}
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/10">
            <div className="flex-1">
              <label className="text-sm font-bold uppercase tracking-wider text-white cursor-pointer">
                Limitar Adivinanzas (n+1)
              </label>
              <p className="text-xs text-neutral-team mt-1">
                Los jugadores solo pueden adivinar el número de la pista + 1
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={localConfig.limitGuesses}
                onChange={(e) => setLocalConfig({ ...localConfig, limitGuesses: e.target.checked })}
                disabled={!isHost}
                className="peer w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-[#4B9FFF] checked:border-[#4B9FFF] appearance-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <svg 
                className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
              </svg>
            </div>
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-team flex items-center gap-2">
              <Users className="w-4 h-4" />
              Máximo de Jugadores
            </label>
            <input
              type="number"
              value={localConfig.maxPlayers}
              onChange={(e) => setLocalConfig({ ...localConfig, maxPlayers: parseInt(e.target.value) })}
              disabled={!isHost}
              min={2}
              max={20}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4B9FFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          {isHost && (
            <button 
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-[#4B9FFF] text-white font-bold hover:bg-[#4B9FFF]/80 transition-all"
            >
              Guardar
            </button>
          )}
        </div>

        {!isHost && (
          <p className="mt-4 text-xs text-neutral-team/60 text-center">
            Solo el host puede modificar la configuración
          </p>
        )}
      </motion.div>
    </div>
  );
}
