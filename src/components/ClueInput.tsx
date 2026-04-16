import React, { useState } from "react";
import { Send, Hash } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClueInputProps {
  onGiveClue: (word: string, count: number) => void;
  disabled: boolean;
  isMyTurn: boolean;
  isSpymaster: boolean;
  teamWordsRemaining: number;
  boardWords: string[];
}

export default function ClueInput({ onGiveClue, disabled, isMyTurn, isSpymaster, teamWordsRemaining, boardWords }: ClueInputProps) {
  const [word, setWord] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");

  const validateWord = (val: string) => {
    const normalize = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    const trimmed = val.trim();
    const normalizedClue = normalize(trimmed);
    
    if (trimmed.includes(" ")) {
      setError("La pista debe ser una sola palabra.");
    } else if (boardWords.some(w => normalize(w) === normalizedClue)) {
      setError("La pista no puede estar en el tablero.");
    } else if (boardWords.some(w => {
      const bw = normalize(w);
      return bw.includes(normalizedClue) || normalizedClue.includes(bw);
    })) {
      setError("La pista es muy similar a una palabra del tablero.");
    } else {
      setError("");
    }
    setWord(trimmed.toUpperCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word && count >= 0 && !error) {
      onGiveClue(word.trim().toUpperCase(), count);
      setWord("");
      setCount(1);
    }
  };

  const getStatusMessage = () => {
    if (!isMyTurn) return "Esperando el turno del rival...";
    if (isSpymaster) return "Es tu turno de dar una pista";
    return "Esperando la pista de tu Spymaster...";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "text-[10px] uppercase font-bold tracking-widest",
          error ? "text-red-team" : "text-neutral-team opacity-50"
        )}>
          {error || getStatusMessage()}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-1.5 md:gap-2">
        <div className="w-16 md:w-20 shrink-0">
          <select
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            disabled={disabled}
            className="w-full bg-white/5 border border-glass-border rounded-xl px-1 md:px-2 py-2.5 md:py-3 text-xs md:text-sm text-center focus:outline-none focus:border-blue-team transition-all appearance-none cursor-pointer font-bold"
          >
            {Array.from({ length: teamWordsRemaining + 1 }, (_, i) => (
              <option key={i} value={i} className="bg-bg text-white">{i}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            value={word}
            onChange={(e) => validateWord(e.target.value)}
            disabled={disabled}
            placeholder="Pista..."
            className={cn(
              "w-full bg-white/5 border rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm focus:outline-none transition-all placeholder:text-neutral-team/40 font-bold uppercase tracking-wider",
              error ? "border-red-team focus:border-red-team" : "border-glass-border focus:border-blue-team"
            )}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !word || !!error}
          className={cn(
            "p-2.5 md:p-3 rounded-xl transition-all shadow-lg shrink-0",
            disabled || !word || !!error
              ? "bg-white/5 text-neutral-team/40 border border-glass-border cursor-not-allowed"
              : "bg-blue-team text-white hover:bg-blue-team/80 shadow-blue-team/20"
          )}
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>
    </div>
  );
}
