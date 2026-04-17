export type Team = "red" | "blue" | "neutral" | "assassin";
export type PlayerTeam = "red" | "blue" | "spectator";
export type Role = "spymaster" | "operative";

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
  timerDuration: number;
  firstTurnMode: "timed" | "unlimited";
  firstTurnDuration: number;
  limitGuesses: boolean;
  maxPlayers: number;
  language: "es" | "en";
  customWords: string[]; 
  wordBankMode: "add" | "replace"; // <-- Agregado para saber qué hacer con las custom
}

export const DEFAULT_CONFIG: GameConfig = {
  timerDuration: 120,
  firstTurnMode: "timed",
  firstTurnDuration: 120,
  limitGuesses: false,
  maxPlayers: 10,
  language: "es",
  customWords: [],
  wordBankMode: "add",
};

export interface GameState {
  roomId: string;
  status: "lobby" | "playing" | "ended";
  cards: Card[];
  players: Player[];
  turn: "red" | "blue";
  currentClue: Clue | null;
  clues: Clue[];
  timer: number;
  isUltimatum: boolean;
  guessesMade: number;
  totalRed?: number;
  totalBlue?: number;
  winner: "red" | "blue" | null;
  config: GameConfig;
  history: {
    red: number;
    blue: number;
  };
}

export function generateBoard(wordList: string[], firstTeam: "red" | "blue"): Card[] {
  const shuffled = [...wordList].sort(() => Math.random() - 0.5).slice(0, 25);
  
  const teams: (Team | "neutral" | "assassin")[] = [
    ...Array(firstTeam === "red" ? 9 : 8).fill("red"),
    ...Array(firstTeam === "blue" ? 9 : 8).fill("blue"),
    ...Array(7).fill("neutral"),
    "assassin",
  ];
  teams.sort(() => Math.random() - 0.5);

  return shuffled.map((word, i) => ({
    id: i,
    word: word.toUpperCase(),
    team: teams[i],
    revealed: false,
  }));
}