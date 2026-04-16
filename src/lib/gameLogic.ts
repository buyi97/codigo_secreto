/**
 * Game logic types and utilities for Codenames
 */

export type Team = "red" | "blue" | "neutral" | "assassin";
export type Role = "spymaster" | "operative";
export type PlayerTeam = "red" | "blue" | "spectator";

export interface Card {
  id: number;
  word: string;
  team: Team;
  revealed: boolean;
}

export interface Player {
  id: string;
  name: string;
  team: PlayerTeam;
  role: Role;
  isHost: boolean;
}

export interface Clue {
  word: string;
  count: number;
  team: "red" | "blue";
}

export interface GameConfig {
  language: "es" | "en";
  timerDuration: number;
  customWords: string[];
  wordBankMode: "append" | "replace";
  firstTurnMode: "unlimited" | "custom" | "same";
  firstTurnDuration: number;
  limitGuesses: boolean;
  password?: string;
  isPublic: boolean;
  maxPlayers: number;
}

export interface GameState {
  roomId: string;
  cards: Card[];
  players: Player[];
  turn: "red" | "blue";
  status: "lobby" | "playing" | "ended";
  winner: PlayerTeam | null;
  clues: Clue[];
  timer: number;
  isUltimatum: boolean;
  isFirstTurn: boolean;
  currentClue: Clue | null;
  guessesMade: number;
  config: GameConfig;
  totalRed: number;
  totalBlue: number;
  history: {
    red: number;
    blue: number;
  };
}

export const DEFAULT_CONFIG: GameConfig = {
  language: "es",
  timerDuration: 90,
  customWords: [],
  wordBankMode: "append",
  firstTurnMode: "same",
  firstTurnDuration: 90,
  limitGuesses: false,
  isPublic: true,
  maxPlayers: 8,
};

export function generateBoard(words: string[], firstTeam: "red" | "blue"): Card[] {
  const boardWords = [...words].sort(() => Math.random() - 0.5).slice(0, 25);
  
  const teams: Team[] = [
    "assassin",
    ...Array(7).fill("neutral"),
    ...Array(8).fill("red"),
    ...Array(8).fill("blue"),
    firstTeam
  ].sort(() => Math.random() - 0.5);

  return boardWords.map((word, i) => ({
    id: i,
    word,
    team: teams[i],
    revealed: false
  }));
}
