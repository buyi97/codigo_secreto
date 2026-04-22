import React from "react";
import { Clue } from "../lib/gameLogic";
import { MessageSquare, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ClueHistoryProps {
  clues: Clue[];
  isMyActiveTurn?: boolean; // Añadir a la interfaz
}

export default function ClueHistory({ clues, isMyActiveTurn }: ClueHistoryProps) {
  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden transition-all duration-300 p-1",
      // Si es el turno activo, resaltamos todo el contenedor
      isMyActiveTurn && "bg-amber-400/5 ring-1 ring-amber-400/30 rounded-xl"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <History className={cn("w-4 h-4", isMyActiveTurn ? "text-amber-400" : "text-neutral-team")} />
        <h3 className={cn(
          "font-bold text-xs uppercase tracking-widest",
          isMyActiveTurn ? "text-amber-400" : "text-neutral-team"
        )}>
          Historial de Pistas {isMyActiveTurn && "• TU TURNO"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        <AnimatePresence initial={false}>
          {clues.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-30">
              <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-2">
                <History className="w-6 h-6" />
              </div>
              <p className="text-[10px] uppercase tracking-widest">Sin pistas aún</p>
            </div>
          ) : (
            [...clues].reverse().map((clue, index) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={index}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-4",
                  clue.team === "red" 
                    ? "bg-red-team/10 border-red-team/30 text-red-team" 
                    : "bg-blue-team/10 border-blue-team/30 text-blue-team"
                )}
              >
                <div className="flex flex-col items-start leading-none shrink-0">
                  <span className="text-[7px] md:text-[8px] uppercase font-black opacity-40 mb-1">Nº</span>
                  <span className="font-black text-xl md:text-2xl">{clue.count}</span>
                </div>
                <div className="flex flex-col items-end leading-none text-right flex-1 overflow-hidden">
                  <span className="text-[7px] md:text-[8px] uppercase font-black opacity-40 mb-1">Pista</span>
                  <span className="font-black text-lg md:text-xl tracking-tight uppercase truncate w-full">{clue.word}</span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
