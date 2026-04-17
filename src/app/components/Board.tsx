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
    <div className="grid grid-cols-5 gap-2 md:gap-3 lg:gap-4 h-full w-full p-2">
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
        "relative w-full h-full rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 flex items-center justify-center text-center transition-all duration-200",
        "font-bold uppercase tracking-wide text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl",
        getTeamStyles(card.team, card.revealed, isSpymaster),
        !disabled && !card.revealed && "cursor-pointer active:scale-95",
        disabled && !card.revealed && "cursor-not-allowed opacity-90",
        card.revealed && "cursor-default"
      )}
    >
      {/* Word */}
      <span className={cn(
        "relative z-10 px-1 leading-tight transition-all duration-300",
        card.revealed && card.team !== "assassin" && "opacity-0",
        card.revealed && card.team === "assassin" && "text-white font-black text-shadow-lg scale-110"
      )}>
        {card.word}
      </span>
      
      {/* Spymaster indicator dot */}
      {isSpymaster && !card.revealed && (
        <div className={cn(
          "absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shadow-lg flex items-center justify-center",
          card.team === "red" ? "bg-red-team shadow-[0_0_10px_rgba(255,75,75,0.7)]" : 
          card.team === "blue" ? "bg-blue-team shadow-[0_0_10px_rgba(75,159,255,0.7)]" : 
          card.team === "neutral" ? "bg-neutral-team shadow-[0_0_5px_rgba(148,163,184,0.5)]" : "bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]"
        )}>
          {card.team === "assassin" && <Skull className="w-2 h-2 md:w-2.5 md:h-2.5 text-black" />}
        </div>
      )}
    </motion.button>
  );
}