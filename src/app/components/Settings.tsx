import React, { useState } from "react";
import { GameState } from "../lib/gameLogic";
import { X, Clock, Infinity, Users, BookOpen } from "lucide-react";
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
  // Aseguramos que siempre haya valores por defecto
  const [localConfig, setLocalConfig] = useState({
    ...config,
    customWords: config.customWords || [],
    wordBankMode: config.wordBankMode || "add",
  });

  const handleSave = () => {
    onUpdate(localConfig);
    onClose();
  };

  const handleWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Separa por comas o saltos de línea y quita espacios
    const text = e.target.value;
    const wordsArray = text.split(/[,\n]+/).map(w => w.trim()).filter(w => w.length > 0);
    setLocalConfig({ ...localConfig, customWords: wordsArray });
  };

  // Validación visual del mínimo de palabras
  const isMissingWords = localConfig.wordBankMode === "replace" && localConfig.customWords.length < 25;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-2xl font-black uppercase text-white">Configuración</h2>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Banco de Palabras Custom */}
        <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/5">
          <label className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Banco de Palabras
          </label>
          
          <div className="flex gap-2">
            <button
              onClick={() => setLocalConfig({ ...localConfig, wordBankMode: "add" })}
              disabled={!isHost}
              className={cn(
                "flex-1 py-2 text-xs rounded-lg font-bold transition-all",
                localConfig.wordBankMode !== "replace" ? "bg-[#4B9FFF] text-white" : "bg-white/5 text-neutral-team hover:bg-white/10",
                !isHost && "opacity-50 cursor-not-allowed"
              )}
            >
              Añadir a Oficial
            </button>
            <button
              onClick={() => setLocalConfig({ ...localConfig, wordBankMode: "replace" })}
              disabled={!isHost}
              className={cn(
                "flex-1 py-2 text-xs rounded-lg font-bold transition-all",
                localConfig.wordBankMode === "replace" ? "bg-[#4B9FFF] text-white" : "bg-white/5 text-neutral-team hover:bg-white/10",
                !isHost && "opacity-50 cursor-not-allowed"
              )}
            >
              Nuevo Banco
            </button>
          </div>
          
          <textarea
            placeholder="Ej: React, Python, Inteligencia Artificial (separadas por coma o enter)"
            defaultValue={localConfig.customWords.join(", ")}
            onChange={handleWordsChange}
            disabled={!isHost}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4B9FFF] transition-all resize-none h-24 text-sm custom-scrollbar disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {isMissingWords && (
            <p className="text-xs font-bold text-[#FF4B4B] animate-pulse">
              ⚠️ Mínimo 25 palabras (Te faltan {25 - localConfig.customWords.length})
            </p>
          )}
        </div>

        {/* Timer Duration */}
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wider text-neutral-team flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duración del Turno (segundos)
          </label>
          <input
            type="number"
            value={localConfig.timerDuration}
            onChange={(e) => setLocalConfig({ ...localConfig, timerDuration: parseInt(e.target.value) || 60 })}
            disabled={!isHost}
            min={10} max={300}
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
                localConfig.firstTurnMode === "timed" ? "bg-[#4B9FFF] text-white" : "bg-white/5 text-neutral-team hover:bg-white/10",
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
                localConfig.firstTurnMode === "unlimited" ? "bg-[#4B9FFF] text-white" : "bg-white/5 text-neutral-team hover:bg-white/10",
                !isHost && "opacity-50 cursor-not-allowed"
              )}
            >
              Ilimitado
            </button>
          </div>
        </div>

        {/* First Turn Duration */}
        {localConfig.firstTurnMode === "timed" && (
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-neutral-team">
              Duración 1er Turno (segundos)
            </label>
            <input
              type="number"
              value={localConfig.firstTurnDuration}
              onChange={(e) => setLocalConfig({ ...localConfig, firstTurnDuration: parseInt(e.target.value) || 60 })}
              disabled={!isHost}
              min={10} max={300}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4B9FFF] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

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
            <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-col gap-3 shrink-0">
        {isHost && (
          <button 
            onClick={handleSave}
            disabled={isMissingWords}
            className="w-full py-3.5 rounded-xl bg-[#4B9FFF] text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(75,159,255,0.4)] hover:bg-[#4B9FFF]/80 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            Guardar Cambios
          </button>
        )}
        {!isHost && (
          <p className="text-xs font-bold text-neutral-team/60 text-center uppercase tracking-widest">
            Solo el líder puede modificar
          </p>
        )}
      </div>
    </div>
  );
}