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
    <div className="grid grid-cols-5 gap-1 sm:gap-2 md:gap-3 h-full w-full max-h-full">
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
      whileHover={!disabled ? { scale: 1.05, zIndex: 10 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative w-full h-full rounded-lg p-0.5 sm:p-1 md:p-2 flex items-center justify-center text-center transition-all duration-200",
        "font-bold uppercase tracking-wider text-[7px] sm:text-[10px] md:text-xs lg:text-sm",
        getTeamStyles(card.team, card.revealed, isSpymaster),
        disabled && !card.revealed && "cursor-default opacity-80",
        card.revealed && "cursor-default overflow-hidden"
      )}
    >
      {/* Word - Hidden when revealed (except for spymaster view or assassin) */}
      <span className={cn(
        "relative z-10 break-words line-clamp-2 leading-tight transition-opacity duration-300",
        card.revealed && card.team !== "assassin" && "opacity-0",
        card.revealed && card.team === "assassin" && "text-white font-black drop-shadow-[0_0_8px_rgba(0,0,0,1)] scale-110"
      )}>
        {card.word}
      </span>
      
      {/* Spymaster indicator dot */}
      {isSpymaster && !card.revealed && (
        <div className={cn(
          "absolute top-1 right-1 w-2 h-2 rounded-full shadow-sm flex items-center justify-center",
          card.team === "red" ? "bg-red-team shadow-[0_0_5px_rgba(244,63,94,0.5)]" : 
          card.team === "blue" ? "bg-blue-team shadow-[0_0_5px_rgba(56,189,248,0.5)]" : 
          card.team === "neutral" ? "bg-neutral-team" : "bg-white"
        )}>
          {card.team === "assassin" && <Skull className="w-1.5 h-1.5 text-black" />}
        </div>
      )}
    </motion.button>
  );
}
