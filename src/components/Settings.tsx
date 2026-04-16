import React, { useState } from "react";
import { GameState } from "../lib/gameLogic";
import { X, Globe, Clock, FileText, Save, Shield, Users } from "lucide-react";
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
  embedded?: boolean;
}

export default function Settings({ config, onUpdate, onClose, isHost, embedded }: SettingsProps) {
  const [language, setLanguage] = useState(config.language);
  const [timerDuration, setTimerDuration] = useState(config.timerDuration);
  const [customWordsText, setCustomWordsText] = useState(config.customWords.join(", "));
  const [wordBankMode, setWordBankMode] = useState(config.wordBankMode);
  const [firstTurnMode, setFirstTurnMode] = useState(config.firstTurnMode);
  const [firstTurnDuration, setFirstTurnDuration] = useState(config.firstTurnDuration);
  const [limitGuesses, setLimitGuesses] = useState(config.limitGuesses);
  const [isPublic, setIsPublic] = useState(config.isPublic);
  const [password, setPassword] = useState(config.password || "");
  const [maxPlayers, setMaxPlayers] = useState(config.maxPlayers || 8);

  const handleSave = () => {
    if (!isHost) return;

    const customWords = customWordsText
      .split(",")
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    // Validation for replace mode
    if (wordBankMode === "replace" && customWords.length < 25) {
      alert("Para el modo 'Reemplazar', debes ingresar al menos 25 palabras.");
      return;
    }

    onUpdate({
      language,
      timerDuration,
      customWords,
      wordBankMode,
      firstTurnMode,
      firstTurnDuration,
      limitGuesses,
      isPublic,
      password: password || undefined,
      maxPlayers
    });
    if (!embedded) onClose();
  };

  const content = (
    <div className={cn(
      "glass-panel border border-glass-border shadow-2xl w-full overflow-hidden",
      embedded ? "bg-transparent border-none shadow-none" : "max-w-2xl my-auto"
    )}>
      {!embedded && (
        <div className="bg-black/40 p-6 flex items-center justify-between border-b border-glass-border">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
            Configuración de la Misión
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6 text-neutral-team" />
          </button>
        </div>
      )}

      <div className={cn(
        "p-4 md:p-8 space-y-8",
        !embedded && "max-h-[70vh] overflow-y-auto custom-scrollbar"
      )}>
        {!isHost && (
          <div className="bg-blue-team/10 border border-blue-team/30 text-blue-team text-[10px] p-3 rounded-xl font-bold flex items-center gap-3">
            <Shield className="w-4 h-4" />
            <span>Solo el Creador de la sala puede modificar estos ajustes.</span>
          </div>
        )}

        <div className={cn("grid gap-8", embedded ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
          {/* Left Column */}
          <div className="space-y-8">
            {/* Language */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <Globe className="w-3 h-3" />
                Idioma del Mazo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["es", "en"].map((lang) => (
                  <button
                    key={lang}
                    disabled={!isHost}
                    onClick={() => setLanguage(lang as any)}
                    className={cn(
                      "py-3 rounded-xl font-bold transition-all border text-xs",
                      language === lang 
                        ? "bg-white text-bg border-white" 
                        : "bg-white/5 border-glass-border text-neutral-team hover:bg-white/10"
                    )}
                  >
                    {lang === "es" ? "Español" : "English"}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <Clock className="w-3 h-3" />
                Tiempo por Turno (segundos)
              </label>
              <input
                type="number"
                disabled={!isHost}
                value={timerDuration}
                onChange={(e) => setTimerDuration(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-team transition-all text-sm"
              />
            </div>

            {/* Max Players */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <Users className="w-3 h-3" />
                Máximo de Jugadores (2-12)
              </label>
              <input
                type="number"
                min={2}
                max={12}
                disabled={!isHost}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Math.min(12, Math.max(2, parseInt(e.target.value) || 2)))}
                className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-team transition-all text-sm"
              />
            </div>

            {/* First Turn Mode */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <Clock className="w-3 h-3" />
                Configuración 1er Turno
              </label>
              <div className="space-y-2">
                {[
                  { id: "unlimited", label: "Tiempo Libre" },
                  { id: "custom", label: "Tiempo Personalizado" },
                  { id: "same", label: "Igual al Turno Normal" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    disabled={!isHost}
                    onClick={() => setFirstTurnMode(mode.id as any)}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl font-bold text-left text-[10px] transition-all border flex items-center justify-between",
                      firstTurnMode === mode.id 
                        ? "bg-white text-bg border-white" 
                        : "bg-white/5 border-glass-border text-neutral-team hover:bg-white/10"
                    )}
                  >
                    {mode.label}
                    {firstTurnMode === mode.id && <Save className="w-3 h-3" />}
                  </button>
                ))}
              </div>
              {firstTurnMode === "custom" && (
                <div className="pt-2">
                  <input
                    type="number"
                    disabled={!isHost}
                    value={firstTurnDuration}
                    onChange={(e) => setFirstTurnDuration(parseInt(e.target.value) || 0)}
                    placeholder="Segundos 1er turno..."
                    className="w-full bg-white/5 border border-glass-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-team transition-all text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Word Bank Mode */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <FileText className="w-3 h-3" />
                Modo de Banco de Palabras
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "append", label: "Sumar al banco existente" },
                  { id: "replace", label: "Reemplazar (mín. 25)" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    disabled={!isHost}
                    onClick={() => setWordBankMode(mode.id as any)}
                    className={cn(
                      "py-3 px-4 rounded-xl font-bold text-left text-[10px] transition-all border",
                      wordBankMode === mode.id 
                        ? "bg-white text-bg border-white" 
                        : "bg-white/5 border-glass-border text-neutral-team hover:bg-white/10"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Words */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                <FileText className="w-3 h-3" />
                Palabras Personalizadas
              </label>
              <textarea
                disabled={!isHost}
                value={customWordsText}
                onChange={(e) => setCustomWordsText(e.target.value)}
                placeholder="Palabra 1, Palabra 2, Palabra 3..."
                className="w-full h-24 px-4 py-3 rounded-xl border border-glass-border bg-white/5 text-white focus:outline-none focus:border-blue-team transition-all resize-none text-[10px]"
              />
            </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-neutral-team uppercase tracking-widest opacity-60">
                  <Shield className="w-3 h-3" />
                  Reglas Especiales
                </label>
                <div className="space-y-2">
                  <div 
                    onClick={() => isHost && setLimitGuesses(!limitGuesses)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                      limitGuesses ? "bg-blue-team/20 border-blue-team" : "bg-white/5 border-glass-border opacity-60"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase">Límite de Palabras (n+1)</span>
                      <span className="text-[9px] text-neutral-team leading-tight mt-1">
                        Solo se puede arriesgar una palabra más del número dado. <br/>
                        <span className="text-blue-team/80 italic">Si la pista es "0", el límite es infinito.</span>
                      </span>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                      limitGuesses ? "bg-blue-team border-blue-team" : "border-neutral-team"
                    )}>
                      {limitGuesses && <Save className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleSave}
            className="w-full bg-white text-bg py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Configuración
          </button>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {content}
      </motion.div>
    </div>
  );
}
