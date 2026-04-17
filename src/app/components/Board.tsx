import React from "react";
import { Card as CardType } from "../lib/gameLogic";
import { motion } from "motion/react";
import { Skull } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BoardProps {
  cards: CardType[];
  isSpymaster: boolean;
  onCardClick: (id: number) => void;
  canClick: boolean;
}

export default function Board({ cards, isSpymaster, onCardClick, canClick }: BoardProps) {
  return (
    // Sin aspect-ratio estricto. grid-rows-5 hace que flexione usando la altura disponible.
    <div className="grid grid-cols-5 grid-rows-5 gap-1.5 md:gap-2 lg:gap-3 w-full h-full min-h-0">
      {cards.map((card) => (
        <Card 
          key={card.id} 
          card={card} 
          isSpymaster={isSpymaster} 
          onClick={() => onCardClick(card.id)}
          disabled={!canClick || card.revealed}
        />
      ))}
    </div>
  );
}

interface CardProps {
  card: CardType;
  isSpymaster: boolean;
  onClick: () => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, isSpymaster, onClick, disabled }) => {
  const getTeamStyles = (team: string, revealed: boolean, spymaster: boolean) => {
    if (revealed) {
      switch (team) {
        case "red": return "card-revealed-red";
        case "blue": return "card-revealed-blue";
        case "neutral": return "card-revealed-neutral";
        case "assassin": return "card-revealed-assassin";
        default: return "bg-card-bg";
      }
    }
    
    if (spymaster) {
      switch (team) {
        case "red": return "card-spymaster-red";
        case "blue": return "card-spymaster-blue";
        case "neutral": return "card-spymaster-neutral";
        case "assassin": return "card-spymaster-assassin";
        default: return "bg-card-bg";
      }
    }

    return "card-hidden";
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.03, zIndex: 10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full h-full min-h-0 rounded-md md:rounded-xl p-1 md:p-2 flex items-center justify-center text-center transition-all duration-200 overflow-hidden shadow-sm border border-white/5",
        getTeamStyles(card.team, card.revealed, isSpymaster),
        !disabled && !card.revealed && "cursor-pointer active:scale-95 hover:shadow-primary/30",
        disabled && !card.revealed && "cursor-not-allowed opacity-90",
        card.revealed && "cursor-default opacity-80"
      )}
    >
      <span 
        className={cn(
          "relative z-10 w-full px-0.5 leading-[1.1] sm:leading-none transition-all duration-300",
          "font-black uppercase tracking-tight md:tracking-tighter break-words hyphens-auto",
          card.revealed && card.team !== "assassin" && "opacity-0",
          card.revealed && card.team === "assassin" && "text-white font-black text-shadow-lg scale-110"
        )}
        style={{ 
          // Matemáticas para clamp: tamaño súper seguro en mobile (0.5rem), ideal para tablet y max en PC
          fontSize: "clamp(0.5rem, 1.5vw + 1.2vh, 1.5rem)", 
          wordBreak: "break-word" 
        }}
      >
        {card.word}
      </span>
      
      {isSpymaster && !card.revealed && (
        <div className={cn(
          "absolute top-1 right-1 md:top-2 md:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-full flex items-center justify-center z-20",
          card.team === "red" ? "bg-[#FF4B4B] shadow-[0_0_10px_rgba(255,75,75,0.7)]" : 
          card.team === "blue" ? "bg-[#4B9FFF] shadow-[0_0_10px_rgba(75,159,255,0.7)]" : 
          card.team === "neutral" ? "bg-[#94a3b8]" : "bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
        )}>
          {card.team === "assassin" && <Skull className="w-[6px] h-[6px] sm:w-[10px] sm:h-[10px] md:w-2.5 md:h-2.5 text-black" />}
        </div>
      )}
    </motion.button>
  );
}